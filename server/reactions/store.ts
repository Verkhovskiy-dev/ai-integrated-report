import { mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { RegisteredNews } from "./registry";

export const REACTIONS = ["useful", "important", "more", "unclear"] as const;
export type Reaction = (typeof REACTIONS)[number];
export type ReactionOperation = "set" | "remove";

export interface ReactionWrite {
  eventId: string;
  browserId: string;
  newsId: string;
  contentVersion: string;
  reaction: Reaction | null;
  operation: ReactionOperation;
  expectedRevision: number;
  title: string;
  url: string;
  sourceUrl?: string;
}

export interface ReactionState {
  browserId: string;
  newsId: string;
  contentVersion: string;
  reaction: Reaction | null;
  revision: number;
  updatedAt: string | null;
  lastEventId: string | null;
}

export type RegistryResolution =
  | { status: "active"; entry: RegisteredNews }
  | { status: "expired"; entry: RegisteredNews }
  | { status: "unknown" };

export class RevisionConflict extends Error {
  constructor(public readonly current: ReactionState) {
    super("reaction_revision_conflict");
  }
}

function rowToState(row: Record<string, unknown> | undefined, identity: Pick<ReactionWrite, "browserId" | "newsId" | "contentVersion">): ReactionState {
  return {
    browserId: identity.browserId,
    newsId: identity.newsId,
    contentVersion: identity.contentVersion,
    reaction: (row?.reaction as Reaction | null | undefined) ?? null,
    revision: Number(row?.revision ?? 0),
    updatedAt: (row?.updated_at as string | undefined) ?? null,
    lastEventId: (row?.last_event_id as string | undefined) ?? null,
  };
}

export class ReactionStore {
  readonly db: DatabaseSync;

  constructor(readonly dbPath: string, readonly namespace: "synthetic" | "production") {
    if (dbPath !== ":memory:") mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reaction_events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        namespace TEXT NOT NULL CHECK(namespace IN ('synthetic','production')),
        browser_id TEXT NOT NULL,
        news_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        reaction TEXT CHECK(reaction IN ('useful','important','more','unclear') OR reaction IS NULL),
        operation TEXT NOT NULL CHECK(operation IN ('set','remove')),
        expected_revision INTEGER NOT NULL,
        resulting_revision INTEGER NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source_url TEXT,
        server_timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS reaction_events_period
        ON reaction_events(namespace, server_timestamp, seq);
      CREATE INDEX IF NOT EXISTS reaction_events_identity
        ON reaction_events(namespace, browser_id, news_id, content_version, seq);
      CREATE TABLE IF NOT EXISTS reaction_state (
        namespace TEXT NOT NULL,
        browser_id TEXT NOT NULL,
        news_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        reaction TEXT CHECK(reaction IN ('useful','important','more','unclear') OR reaction IS NULL),
        revision INTEGER NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source_url TEXT,
        updated_at TEXT NOT NULL,
        last_event_id TEXT NOT NULL,
        PRIMARY KEY(namespace, browser_id, news_id, content_version)
      );
      CREATE TABLE IF NOT EXISTS news_registry (
        news_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source_url TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        active_until TEXT,
        last_snapshot_id TEXT,
        PRIMARY KEY(news_id, content_version)
      );
      CREATE TABLE IF NOT EXISTS news_registry_state (
        singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
        snapshot_id TEXT NOT NULL,
        refreshed_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ru_count INTEGER NOT NULL,
        en_count INTEGER NOT NULL,
        unique_count INTEGER NOT NULL,
        origin TEXT NOT NULL
      );
    `);
    const registryColumns = new Set(
      (this.db.prepare("PRAGMA table_info(news_registry)").all() as Array<{ name: string }>).map((column) => column.name),
    );
    if (!registryColumns.has("active_until")) this.db.exec("ALTER TABLE news_registry ADD COLUMN active_until TEXT");
    if (!registryColumns.has("last_snapshot_id")) this.db.exec("ALTER TABLE news_registry ADD COLUMN last_snapshot_id TEXT");
    this.migrateImportantReaction();
  }

  private migrateImportantReaction() {
    // SQLite CHECK constraints require rebuilding the tables. Keep both changes
    // atomic, including event IDs, revisions, explicit indexes and sequence.
    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const table of ["reaction_events", "reaction_state"]) {
        const { sql } = this.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) as { sql: string };
        if (sql.includes("'important'")) continue;
        const oldCheck = "reaction IN ('useful','more','unclear')";
        if (!sql.includes(oldCheck)) throw new Error("unsupported_reaction_schema");
        const indexes = this.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL").all(table) as Array<{ sql: string }>;
        const sequence = this.db.prepare("SELECT seq FROM sqlite_sequence WHERE name = ?").get(table) as { seq: number } | undefined;
        const upgraded = sql.replace(/CREATE TABLE\s+["`]?\w+["`]?/i, 'CREATE TABLE ' + table + '_important_v2')
          .replace(oldCheck, "reaction IN ('useful','important','more','unclear')");
        this.db.exec(upgraded);
        this.db.exec('INSERT INTO ' + table + '_important_v2 SELECT * FROM ' + table + '; DROP TABLE ' + table + '; ALTER TABLE ' + table + '_important_v2 RENAME TO ' + table + ';');
        for (const index of indexes) this.db.exec(index.sql);
        if (sequence) this.db.prepare("UPDATE sqlite_sequence SET seq = MAX(seq, ?) WHERE name = ?").run(sequence.seq, table);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  close() {
    this.db.close();
  }

  health() {
    const result = this.db.prepare("SELECT 1 AS ok").get() as { ok: number };
    if (result.ok !== 1) throw new Error("sqlite_health_failed");
    return { ok: true, storage: "sqlite", namespace: this.namespace };
  }

  getCurrent(identity: Pick<ReactionWrite, "browserId" | "newsId" | "contentVersion">): ReactionState {
    const row = this.db.prepare(`
      SELECT reaction, revision, updated_at, last_event_id
      FROM reaction_state
      WHERE namespace = ? AND browser_id = ? AND news_id = ? AND content_version = ?
    `).get(this.namespace, identity.browserId, identity.newsId, identity.contentVersion) as Record<string, unknown> | undefined;
    return rowToState(row, identity);
  }

  replaceRegistrySnapshot(
    ruEntries: RegisteredNews[],
    enEntries: RegisteredNews[],
    origin: string,
    refreshedAt = new Date().toISOString(),
    ttlHours = 24,
  ) {
    if (ruEntries.length === 0) throw new Error("invalid_ru_registry_empty");
    if (enEntries.length === 0) throw new Error("invalid_en_registry_empty");
    if (!Number.isFinite(ttlHours) || ttlHours <= 0 || ttlHours > 168) throw new Error("invalid_registry_ttl_hours");
    const refreshedMs = Date.parse(refreshedAt);
    if (!Number.isFinite(refreshedMs)) throw new Error("invalid_registry_refreshed_at");
    const expiresAt = new Date(refreshedMs + ttlHours * 3_600_000).toISOString();
    const snapshotId = crypto.randomUUID();
    const combined = new Map<string, RegisteredNews>();
    for (const entry of [...ruEntries, ...enEntries]) {
      const key = `${entry.newsId}:${entry.contentVersion}`;
      const previous = combined.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(entry)) throw new Error("conflicting_registry_entry");
      combined.set(key, entry);
    }
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const statement = this.db.prepare(`
        INSERT INTO news_registry(news_id, content_version, title, url, source_url, first_seen_at, last_seen_at, active_until, last_snapshot_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(news_id, content_version) DO UPDATE SET
          title = excluded.title,
          url = excluded.url,
          source_url = excluded.source_url,
          last_seen_at = excluded.last_seen_at,
          active_until = excluded.active_until,
          last_snapshot_id = excluded.last_snapshot_id
      `);
      for (const entry of combined.values()) statement.run(
        entry.newsId, entry.contentVersion, entry.title, entry.url, entry.sourceUrl ?? null,
        refreshedAt, refreshedAt, expiresAt, snapshotId,
      );
      this.db.prepare(`
        INSERT INTO news_registry_state(singleton, snapshot_id, refreshed_at, expires_at, ru_count, en_count, unique_count, origin)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(singleton) DO UPDATE SET
          snapshot_id = excluded.snapshot_id,
          refreshed_at = excluded.refreshed_at,
          expires_at = excluded.expires_at,
          ru_count = excluded.ru_count,
          en_count = excluded.en_count,
          unique_count = excluded.unique_count,
          origin = excluded.origin
      `).run(snapshotId, refreshedAt, expiresAt, ruEntries.length, enEntries.length, combined.size, origin);
      this.db.exec("COMMIT");
      return {
        snapshotId,
        refreshedAt,
        expiresAt,
        ruCount: ruEntries.length,
        enCount: enEntries.length,
        uniqueCount: combined.size,
        origin,
      };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  getRegistryState() {
    return this.db.prepare(`
      SELECT snapshot_id AS snapshotId, refreshed_at AS refreshedAt, expires_at AS expiresAt,
             ru_count AS ruCount, en_count AS enCount, unique_count AS uniqueCount, origin
      FROM news_registry_state WHERE singleton = 1
    `).get() as Record<string, unknown> | undefined;
  }

  resolveRegisteredNews(newsId: string, contentVersion: string, at = new Date().toISOString()): RegistryResolution {
    const row = this.db.prepare(`
      SELECT news_id AS newsId, content_version AS contentVersion, title, url,
             source_url AS sourceUrl, active_until AS activeUntil
      FROM news_registry WHERE news_id = ? AND content_version = ?
    `).get(newsId, contentVersion) as (RegisteredNews & { activeUntil: string | null }) | undefined;
    if (!row) return { status: "unknown" };
    const state = this.getRegistryState() as { expiresAt?: string } | undefined;
    const { activeUntil: _activeUntil, ...entry } = row;
    if (row.activeUntil && row.activeUntil > at && state?.expiresAt && state.expiresAt > at) {
      return { status: "active", entry };
    }
    return { status: "expired", entry };
  }

  apply(input: ReactionWrite): { duplicate: boolean; state: ReactionState; serverTimestamp: string; eventId: string } {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const duplicate = this.db.prepare(`
        SELECT event_id, browser_id, news_id, content_version, reaction, operation,
               expected_revision, server_timestamp
        FROM reaction_events WHERE event_id = ?
      `).get(input.eventId) as Record<string, unknown> | undefined;

      if (duplicate) {
        const same = duplicate.browser_id === input.browserId
          && duplicate.news_id === input.newsId
          && duplicate.content_version === input.contentVersion
          && duplicate.reaction === input.reaction
          && duplicate.operation === input.operation
          && Number(duplicate.expected_revision) === input.expectedRevision;
        if (!same) throw new Error("event_id_payload_mismatch");
        const state = this.getCurrent(input);
        this.db.exec("COMMIT");
        return { duplicate: true, state, serverTimestamp: String(duplicate.server_timestamp), eventId: input.eventId };
      }

      const current = this.getCurrent(input);
      if (current.revision !== input.expectedRevision) throw new RevisionConflict(current);
      const revision = current.revision + 1;
      const serverTimestamp = new Date().toISOString();
      const nextReaction = input.operation === "remove" ? null : input.reaction;

      this.db.prepare(`
        INSERT INTO reaction_events (
          event_id, namespace, browser_id, news_id, content_version, reaction,
          operation, expected_revision, resulting_revision, title, url, source_url,
          server_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.eventId, this.namespace, input.browserId, input.newsId, input.contentVersion,
        nextReaction, input.operation, input.expectedRevision, revision, input.title,
        input.url, input.sourceUrl ?? null, serverTimestamp,
      );
      this.db.prepare(`
        INSERT INTO reaction_state (
          namespace, browser_id, news_id, content_version, reaction, revision,
          title, url, source_url, updated_at, last_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(namespace, browser_id, news_id, content_version) DO UPDATE SET
          reaction = excluded.reaction,
          revision = excluded.revision,
          title = excluded.title,
          url = excluded.url,
          source_url = excluded.source_url,
          updated_at = excluded.updated_at,
          last_event_id = excluded.last_event_id
      `).run(
        this.namespace, input.browserId, input.newsId, input.contentVersion,
        nextReaction, revision, input.title, input.url, input.sourceUrl ?? null,
        serverTimestamp, input.eventId,
      );
      this.db.exec("COMMIT");
      return { duplicate: false, state: this.getCurrent(input), serverTimestamp, eventId: input.eventId };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  listEvents(from: string, to: string) {
    return this.db.prepare(`
      SELECT seq, event_id AS eventId, browser_id AS browserId, news_id AS newsId,
             content_version AS contentVersion, reaction, operation,
             expected_revision AS expectedRevision, resulting_revision AS resultingRevision,
             title, url, source_url AS sourceUrl, server_timestamp AS serverTimestamp
      FROM reaction_events
      WHERE namespace = ? AND server_timestamp >= ? AND server_timestamp < ?
      ORDER BY seq
    `).all(this.namespace, from, to);
  }

  summary(from: string, to: string) {
    const operations = this.db.prepare(`
      SELECT operation, reaction, COUNT(*) AS count
      FROM reaction_events
      WHERE namespace = ? AND server_timestamp >= ? AND server_timestamp < ?
      GROUP BY operation, reaction ORDER BY operation, reaction
    `).all(this.namespace, from, to);
    const active = this.db.prepare(`
      WITH ranked AS (
        SELECT news_id, content_version, browser_id, reaction, title, url, source_url,
               ROW_NUMBER() OVER (
                 PARTITION BY browser_id, news_id, content_version ORDER BY seq DESC
               ) AS rank
        FROM reaction_events
        WHERE namespace = ? AND server_timestamp < ?
      )
      SELECT news_id AS newsId, content_version AS contentVersion, title, url,
             source_url AS sourceUrl,
             SUM(CASE WHEN reaction = 'useful' THEN 1 ELSE 0 END) AS useful,
             SUM(CASE WHEN reaction = 'important' THEN 1 ELSE 0 END) AS important,
             SUM(CASE WHEN reaction = 'more' THEN 1 ELSE 0 END) AS more,
             SUM(CASE WHEN reaction = 'unclear' THEN 1 ELSE 0 END) AS unclear,
             SUM(CASE WHEN reaction IS NOT NULL THEN 1 ELSE 0 END) AS activeReactions
      FROM ranked WHERE rank = 1
      GROUP BY news_id, content_version, title, url, source_url
      ORDER BY activeReactions DESC, news_id, content_version
    `).all(this.namespace, to);
    const operationCount = Number((this.db.prepare(`
      SELECT COUNT(*) AS count FROM reaction_events
      WHERE namespace = ? AND server_timestamp >= ? AND server_timestamp < ?
    `).get(this.namespace, from, to) as { count: number }).count);
    const activeCount = (active as Array<Record<string, unknown>>)
      .reduce((sum, row) => sum + Number(row.activeReactions), 0);
    return {
      namespace: this.namespace,
      period: { from, to, timezone: "+05:00", semantics: "[from,to)" },
      operationCount,
      activeReactionCountAtEnd: activeCount,
      operations,
      newsVersions: active,
      interpretation: [
        "activeReactionCountAtEnd is not the number of operations or unique people",
        "browserId identifies one browser installation, not a person",
        "useful is self-report, not proven application or audience growth",
        "no exposure denominator is collected; percentages are intentionally omitted",
        "different contentVersion values must not be combined as one preference",
      ],
    };
  }

  purgeBefore(cutoff: string) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const events = this.db.prepare(`DELETE FROM reaction_events WHERE namespace = ? AND server_timestamp < ?`).run(this.namespace, cutoff);
      const states = this.db.prepare(`DELETE FROM reaction_state WHERE namespace = ? AND updated_at < ?`).run(this.namespace, cutoff);
      this.db.exec("COMMIT");
      return { eventsDeleted: Number(events.changes), statesDeleted: Number(states.changes) };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  deleteBrowser(browserId: string) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const events = this.db.prepare(`DELETE FROM reaction_events WHERE namespace = ? AND browser_id = ?`).run(this.namespace, browserId);
      const states = this.db.prepare(`DELETE FROM reaction_state WHERE namespace = ? AND browser_id = ?`).run(this.namespace, browserId);
      this.db.exec("COMMIT");
      return { eventsDeleted: Number(events.changes), statesDeleted: Number(states.changes) };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
