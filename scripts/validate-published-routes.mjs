import { readFile } from "node:fs/promises";
import path from "node:path";

const [registryPath, siteRoot] = process.argv.slice(2);

if (!registryPath || !siteRoot) {
  console.error("Usage: node scripts/validate-published-routes.mjs <registry.json> <published-site-dir>");
  process.exit(1);
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
let positionsIndexPath = path.join(siteRoot, "positions", "index.html");
let positionsIndex;
try {
  positionsIndex = await readFile(positionsIndexPath, "utf8");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  positionsIndexPath = path.join(siteRoot, "index.html");
  positionsIndex = await readFile(positionsIndexPath, "utf8");
}
const moduleScript = positionsIndex.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i)
  ?? positionsIndex.match(/<script[^>]+src=["']([^"']+)["'][^>]+type=["']module["']/i);

if (!moduleScript) {
  console.error(`Не найден module bundle в ${positionsIndexPath}`);
  process.exit(1);
}

const bundlePath = path.join(siteRoot, moduleScript[1].replace(/^\//, ""));
const bundle = await readFile(bundlePath, "utf8");
const errors = [];

for (const route of registry.routes ?? []) {
  if (!route.enabled) continue;
  if (!bundle.includes(route.placeId)) {
    errors.push(`Опубликованный bundle не содержит placeId ${route.placeId}`);
  }
  if (!bundle.includes(route.positionRouteId)) {
    errors.push(`Опубликованный bundle не содержит positionRouteId ${route.positionRouteId}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Published route bundle valid: ${(registry.routes ?? []).filter((route) => route.enabled).length} routes in ${moduleScript[1]}`);
