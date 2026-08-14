import { readFile } from "node:fs/promises";

const [placesPath, registryPath, limitArg = "12"] = process.argv.slice(2);

if (!placesPath || !registryPath) {
  console.error("Usage: node scripts/route-agents/plan-route-jobs.mjs <places_data.json> <ekenRoutes.json> [limit]");
  process.exit(1);
}

const placesData = JSON.parse(await readFile(placesPath, "utf8"));
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const enabledPlaceIds = new Set((registry.routes ?? []).filter((route) => route.enabled).map((route) => route.placeId));
const limit = Math.max(1, Number.parseInt(limitArg, 10) || 12);

function priority(place) {
  let score = 0;
  if (place.window?.category === "open") score += 4;
  if (place.window?.category === "narrowing") score += 2;
  if (place.confidence === "high" || place.capacity?.confidence === "high") score += 3;
  if (place.capacity?.category === "large") score += 2;
  if (place.capacity?.category === "medium") score += 1;
  score += Math.min(2, place.audience_lens?.length ?? 0);
  return score;
}

const jobs = (placesData.places ?? [])
  .filter((place) => place.id && !enabledPlaceIds.has(place.id))
  .map((place) => ({
    jobType: "build-position-route",
    placeId: place.id,
    priority: priority(place),
    place: {
      id: place.id,
      srtLevel: place.srt_level,
      srtLevelName: place.srt_level_name,
      name: place.name,
      description: place.description,
      window: place.window,
      capacity: place.capacity,
      entryConditions: place.entry_conditions,
      keyPlayers: place.key_players,
      audienceLens: place.audience_lens,
      evidence: place.evidence,
      lastUpdated: place.last_updated,
    },
    outputContract: "automation/route-agents/route-draft.schema.json",
    status: "queued",
  }))
  .sort((a, b) => b.priority - a.priority || a.placeId.localeCompare(b.placeId))
  .slice(0, limit);

console.log(JSON.stringify({
  schemaVersion: "1.0",
  mapVersion: placesData.meta?.version ?? null,
  generatedAt: new Date().toISOString(),
  enabledRoutes: enabledPlaceIds.size,
  remainingPlaces: Math.max(0, (placesData.places ?? []).length - enabledPlaceIds.size),
  jobs,
}, null, 2));
