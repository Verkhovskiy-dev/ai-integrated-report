import { reactionConfig } from "./config";
import { ReactionStore } from "./store";
import { registryEntriesFromFile } from "./registry";

async function main() {
  const config = reactionConfig();
  const store = new ReactionStore(config.dbPath, config.namespace);
  const [command, value, extra] = process.argv.slice(2);
  try {
    if (command === "registry-refresh" && value) {
      const entries = await registryEntriesFromFile(value, extra);
      console.log(JSON.stringify({ command, source: value, ...store.upsertRegistry(entries) }));
    } else if (command === "purge-before" && value && Number.isFinite(Date.parse(value))) {
      console.log(JSON.stringify({ command, cutoff: new Date(value).toISOString(), ...store.purgeBefore(new Date(value).toISOString()) }));
    } else if (command === "purge-retention") {
      const days = Number(value ?? config.retentionDays);
      if (!Number.isFinite(days) || days <= 0) throw new Error("retention days must be positive");
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
      console.log(JSON.stringify({ command, days, cutoff, ...store.purgeBefore(cutoff) }));
    } else if (command === "delete-browser" && value) {
      console.log(JSON.stringify({ command, browserId: value, ...store.deleteBrowser(value) }));
    } else {
      throw new Error("usage: reactions:cli -- registry-refresh <trusted-report.json> [site-origin] | purge-before <ISO> | purge-retention [days] | delete-browser <browserId>");
    }
  } finally {
    store.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "reaction_cli_failed");
  process.exitCode = 1;
});
