import express from "express";
import { createServer } from "node:http";
import { createReactionRouter } from "./reactions/api";
import { reactionConfig } from "./reactions/config";
import { createNewsRegistry } from "./reactions/registry";
import { ReactionStore } from "./reactions/store";

const config = reactionConfig();
if (config.namespace === "production" && !config.adminToken) throw new Error("REACTIONS_ADMIN_TOKEN is required in production namespace");
if (!Number.isFinite(config.retentionDays) || config.retentionDays <= 0) throw new Error("REACTIONS_RETENTION_DAYS must be positive");
if (!Number.isFinite(config.registryTtlHours) || config.registryTtlHours <= 0 || config.registryTtlHours > 168) throw new Error("REACTIONS_REGISTRY_TTL_HOURS must be within (0,168]");

const store = new ReactionStore(config.dbPath, config.namespace);
store.health();
if (config.namespace === "synthetic" && !store.getRegistryState()) {
  const seed = [...createNewsRegistry().values()];
  store.replaceRegistrySnapshot(seed, seed, "bundled-synthetic", new Date().toISOString(), config.registryTtlHours);
}
const cutoff = new Date(Date.now() - config.retentionDays * 86_400_000).toISOString();
const purged = store.purgeBefore(cutoff);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use("/api/reactions", express.json({ limit: "16kb" }), createReactionRouter({
  store,
  allowedOrigins: config.allowedOrigins,
  adminToken: config.adminToken,
}));
app.use((_req, res) => res.status(404).json({ error: "not_found" }));

const server = createServer(app);
server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({
    event: "reaction_service_started",
    host: config.host,
    port: config.port,
    namespace: config.namespace,
    retentionDays: config.retentionDays,
    registryTtlHours: config.registryTtlHours,
    startupPurge: purged,
  }));
});

const shutdown = () => server.close(() => { store.close(); process.exit(0); });
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
