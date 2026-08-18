import { runRouteSystem, validateScenarioRegistry } from "./dashboard-routes/route-system.mjs";

const [reportPath = "data/latest-report.json", registryPath = "client/src/data/ekenScenarios.json"] = process.argv.slice(2);
const { plan, registry } = await runRouteSystem({ reportPath, registryPath, mode: "plan" });
const errors = validateScenarioRegistry(registry);

const missingOrStale = plan.jobs.filter((job) => job.state !== "current");
if (missingOrStale.length) {
  errors.push(...missingOrStale.map((job) => `${job.state}: ${job.source.surface}/${job.source.sourceId}`));
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Dashboard routes valid: ${plan.stats.discovered} entry points, all current`);
