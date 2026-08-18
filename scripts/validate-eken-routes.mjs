import fs from "node:fs";
import path from "node:path";

const [, , registryArg = "client/src/data/ekenRoutes.json", placesArg] = process.argv;
const registryPath = path.resolve(registryArg);
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const errors = [];

if (registry.schemaVersion !== "1.1") errors.push("schemaVersion должен быть 1.1");
if (!Array.isArray(registry.routes)) errors.push("routes должен быть массивом");

const placeIds = new Set();
const routePairs = new Set();
for (const [index, route] of (registry.routes ?? []).entries()) {
  const prefix = `routes[${index}]`;
  if (!route.placeId) errors.push(`${prefix}.placeId обязателен`);
  if (!route.positionRouteId) errors.push(`${prefix}.positionRouteId обязателен`);
  if (typeof route.enabled !== "boolean") errors.push(`${prefix}.enabled должен быть boolean`);
  if (!route.ctaLabel) errors.push(`${prefix}.ctaLabel обязателен`);
  if (route.surface !== "places-map") errors.push(`${prefix}.surface должен быть places-map`);
  if (route.sourceId !== route.placeId) errors.push(`${prefix}.sourceId должен совпадать с placeId`);
  if (route.scenarioId !== route.positionRouteId) errors.push(`${prefix}.scenarioId должен совпадать с positionRouteId`);
  if (!Number.isInteger(route.version) || route.version < 1) errors.push(`${prefix}.version должен быть положительным целым числом`);
  if (!route.promise) errors.push(`${prefix}.promise обязателен`);
  if (!route.artifact) errors.push(`${prefix}.artifact обязателен`);
  if (!Number.isFinite(route.estimatedMinutes) || route.estimatedMinutes <= 0) errors.push(`${prefix}.estimatedMinutes должен быть положительным числом`);
  if (!Array.isArray(route.starterInputs) || !route.starterInputs.length) errors.push(`${prefix}.starterInputs должен содержать минимум один элемент`);
  if (!Array.isArray(route.successCriteria) || !route.successCriteria.length) errors.push(`${prefix}.successCriteria должен содержать минимум один элемент`);

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
