import path from "node:path";

function namespace(value: string | undefined): "synthetic" | "production" {
  const selected = value ?? "synthetic";
  if (selected !== "synthetic" && selected !== "production") throw new Error("REACTIONS_NAMESPACE must be synthetic or production");
  return selected;
}

export function reactionConfig(env = process.env) {
  const selectedNamespace = namespace(env.REACTIONS_NAMESPACE);
  const defaultDb = path.resolve(process.cwd(), "var", `reactions-${selectedNamespace}.sqlite`);
  const origins = (env.REACTIONS_ALLOWED_ORIGINS ?? "http://127.0.0.1:3000,http://localhost:3000")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return {
    namespace: selectedNamespace,
    dbPath: env.REACTIONS_DB_PATH ? path.resolve(env.REACTIONS_DB_PATH) : defaultDb,
    allowedOrigins: origins,
    adminToken: env.REACTIONS_ADMIN_TOKEN,
    host: env.HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? 3000),
    retentionDays: Number(env.REACTIONS_RETENTION_DAYS ?? (selectedNamespace === "production" ? 30 : 7)),
  };
}
