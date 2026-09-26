import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { REACTIONS, ReactionStore, RevisionConflict, type Reaction, type ReactionWrite } from "./store";

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{7,127}$/;
const EVENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;

export interface ReactionApiOptions {
  store: ReactionStore;
  allowedOrigins: string[];
  adminToken?: string;
  rateLimitPerMinute?: number;
  now?: () => Date;
}

function text(value: unknown, max: number, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) throw new Error(`invalid_${field}`);
  return value.trim();
}

function identifier(value: unknown, field: string): string {
  const result = text(value, 128, field);
  if (!ID_PATTERN.test(result)) throw new Error(`invalid_${field}`);
  return result;
}

function iso(value: unknown, field: string): string {
  const result = text(value, 64, field);
  if (!Number.isFinite(Date.parse(result))) throw new Error(`invalid_${field}`);
  return new Date(result).toISOString();
}

function url(value: unknown, field: string, optional = false): string | undefined {
  if (optional && (value === undefined || value === null || value === "")) return undefined;
  const result = text(value, 2048, field);
  const parsed = new URL(result);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`invalid_${field}`);
  return result;
}

function parseWrite(body: Record<string, unknown>, store: ReactionStore, now: Date): ReactionWrite {
  const operation = body.operation;
  if (operation !== "set" && operation !== "remove") throw new Error("invalid_operation");
  const reaction = operation === "remove" ? null : body.reaction;
  if (reaction !== null && !REACTIONS.includes(reaction as Reaction)) throw new Error("invalid_reaction");
  const expectedRevision = Number(body.expectedRevision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error("invalid_expectedRevision");
  const eventId = text(body.eventId, 64, "eventId");
  if (!EVENT_ID_PATTERN.test(eventId)) throw new Error("invalid_eventId");
  const newsId = identifier(body.newsId, "newsId");
  const contentVersion = identifier(body.contentVersion, "contentVersion");
  const browserId = identifier(body.browserId, "browserId");
  const resolved = store.resolveRegisteredNews(newsId, contentVersion, now.toISOString());
  if (resolved.status === "unknown") throw new Error("unknown_news_version");
  if (resolved.status === "expired") {
    const current = store.getCurrent({ browserId, newsId, contentVersion });
    if (operation !== "remove" || current.reaction === null) throw new Error("expired_news_version");
  }
  const registered = resolved.entry;
  return {
    eventId,
    browserId,
    newsId,
    contentVersion,
    reaction: reaction as Reaction | null,
    operation,
    expectedRevision,
    title: registered.title,
    url: registered.url,
    sourceUrl: registered.sourceUrl,
  };
}

function authorized(req: Request, token?: string) {
  if (!token) return false;
  const header = req.get("authorization") ?? "";
  const candidate = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(candidate);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createReactionRouter({ store, allowedOrigins, adminToken, rateLimitPerMinute = 60, now = () => new Date() }: ReactionApiOptions) {
  const router = Router();
  const rate = new Map<string, number[]>();
  const ipSalt = crypto.randomBytes(32);
  const allow = (key: string, limit: number) => {
    const now = Date.now();
    if (rate.size > 5_000) {
      for (const [candidate, timestamps] of rate) {
        if (timestamps.every((timestamp) => timestamp <= now - 60_000)) rate.delete(candidate);
        if (rate.size <= 4_000) break;
      }
    }
    const recent = (rate.get(key) ?? []).filter((timestamp) => timestamp > now - 60_000);
    if (recent.length >= limit) return false;
    recent.push(now);
    rate.set(key, recent);
    return true;
  };

  router.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: "origin_not_allowed" });
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") return res.status(204).end();
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/health", (_req, res) => {
    try {
      res.json(store.health());
    } catch {
      res.status(503).json({ ok: false, error: "storage_unavailable" });
    }
  });

  router.get("/current", (req, res) => {
    try {
      const identity = {
        browserId: identifier(req.query.browserId, "browserId"),
        newsId: identifier(req.query.newsId, "newsId"),
        contentVersion: identifier(req.query.contentVersion, "contentVersion"),
      };
      res.json({ ok: true, state: store.getCurrent(identity) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      if (message.startsWith("invalid_")) return res.status(400).json({ error: message });
      console.error("reaction_current_failed", error);
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.post("/events", (req: Request, res: Response) => {
    try {
      const input = parseWrite(req.body as Record<string, unknown>, store, now());
      const ipKey = crypto.createHmac("sha256", ipSalt).update(req.ip || "unknown").digest("hex").slice(0, 24);
      if (!allow("global", 1_500) || !allow(`ip:${ipKey}`, Math.max(rateLimitPerMinute * 2, 120)) || !allow(`browser:${input.browserId}`, rateLimitPerMinute)) {
        return res.status(429).json({ error: "rate_limited", retryAfterSeconds: 60 });
      }
      const result = store.apply(input);
      res.status(result.duplicate ? 200 : 201).json({ ok: true, ...result });
    } catch (error) {
      if (error instanceof RevisionConflict) return res.status(409).json({ error: error.message, current: error.current });
      const message = error instanceof Error ? error.message : "internal_error";
      if (message === "event_id_payload_mismatch") return res.status(409).json({ error: message });
      if (message === "expired_news_version") return res.status(410).json({ error: message });
      if (message.startsWith("invalid_") || message === "unknown_news_version") return res.status(400).json({ error: message });
      console.error("reaction_write_failed", error);
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.use("/editor", (req, res, next) => {
    if (!authorized(req, adminToken)) return res.status(401).json({ error: "editor_authorization_required" });
    next();
  });

  router.get("/editor/summary", (req, res) => {
    try {
      const from = iso(req.query.from, "from");
      const to = iso(req.query.to, "to");
      if (from >= to) throw new Error("invalid_period");
      res.json(store.summary(from, to));
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      if (message.startsWith("invalid_")) return res.status(400).json({ error: message });
      console.error("reaction_summary_failed", error);
      res.status(500).json({ error: "internal_error" });
    }
  });

  router.get("/editor/events", (req, res) => {
    try {
      const from = iso(req.query.from, "from");
      const to = iso(req.query.to, "to");
      if (from >= to) throw new Error("invalid_period");
      res.json({ namespace: store.namespace, events: store.listEvents(from, to) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      if (message.startsWith("invalid_")) return res.status(400).json({ error: message });
      console.error("reaction_events_read_failed", error);
      res.status(500).json({ error: "internal_error" });
    }
  });

  return router;
}
