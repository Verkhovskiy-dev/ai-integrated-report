import fs from "node:fs";
import path from "node:path";

const [, , registryArg = "client/src/data/ekenRoutes.json", placesArg] = process.argv;
const registryPath = path.resolve(registryArg);
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const errors = [];

if (registry.schemaVersion !== "1.0") errors.push("schemaVersion должен быть 1.0");
if (!Array.isArray(registry.routes)) errors.push("routes должен быть массивом");

const placeIds = new Set();
const routePairs = new Set();
for (const [index, route] of (registry.routes ?? []).entries()) {
  const prefix = `routes[${index}]`;
  if (!route.placeId) errors.push(`${prefix}.placeId обязателен`);
  if (!route.positionRouteId) errors.push(`${prefix}.positionRouteId обязателен`);
  if (typeof route.enabled !== "boolean") errors.push(`${prefix}.enabled должен быть boolean`);
  if (!route.ctaLabel) errors.push(`${prefix}.ctaLabel обязателен`);

  const pair = `${route.placeId}:${route.positionRouteId}`;
  if (routePairs.has(pair)) errors.push(`Дублируется маршрут ${pair}`);
  routePairs.add(pair);

  if (route.enabled && placeIds.has(route.placeId)) {
    errors.push(`Для места ${route.placeId} включено более одного маршрута`);
  }
  if (route.enabled) placeIds.add(route.placeId);
}

if (placesArg) {
  const placesPath = path.resolve(placesArg);
  const placesData = JSON.parse(fs.readFileSync(placesPath, "utf8"));
  const currentPlaceIds = new Set((placesData.places ?? []).map((place) => place.id));
  for (const route of registry.routes ?? []) {
    if (route.enabled && !currentPlaceIds.has(route.placeId)) {
      errors.push(`Место ${route.placeId} отсутствует в актуальной карте ${placesPath}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Eken registry valid: ${(registry.routes ?? []).filter((route) => route.enabled).length} enabled routes`);
