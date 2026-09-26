CREATE TABLE IF NOT EXISTS reaction_events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        namespace TEXT NOT NULL CHECK(namespace IN ('synthetic','production')),
        browser_id TEXT NOT NULL,
        news_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        reaction TEXT CHECK(reaction IN ('useful','more','unclear') OR reaction IS NULL),
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
        reaction TEXT CHECK(reaction IN ('useful','more','unclear') OR reaction IS NULL),
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
