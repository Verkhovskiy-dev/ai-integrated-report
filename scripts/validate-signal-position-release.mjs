import fs from "node:fs";

const positionsPath = "client/src/pages/Positions.tsx";
const relationsPath = "client/src/data/signalPositionRelations.ts";
const integrationPath = "client/src/data/ekenIntegrationUrl.ts";
const positions = fs.readFileSync(positionsPath, "utf8");
const relations = fs.readFileSync(relationsPath, "utf8");
const integration = fs.readFileSync(integrationPath, "utf8");
const errors = [];

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function forbidMatch(source, pattern, message) {
  if (pattern.test(source)) errors.push(message);
}

requireMatch(positions, /resolveSignalPositionRelations/, "Positions must resolve the requested stable signal instead of inventing relations");
requireMatch(positions, /data-role="signal-position-relations"/, "Full relation-map DOM contract is missing");
requireMatch(positions, /data-role="single-relation-state"/, "Single-position fallback DOM contract is missing");
requireMatch(positions, /["']zero-relations-state["']/, "Zero/stale signal state DOM contract is missing");
requireMatch(positions, /aria-pressed=\{active\}/, "Position choices must expose aria-pressed");
requireMatch(positions, /aria-live="polite"/, "Selection changes must have a polite live region");
requireMatch(positions, /useTranslation\(\)/, "Positions must derive RU/EN content from the active locale");
requireMatch(positions, /(?:replaceState|pushState)\s*\(/, "Selected signal/relation context must be written to history for refresh/back-forward");
forbidMatch(positions, /Subscription|Subscribe|Подпис(?:ка|аться)|subscription/i, "Subscription UI must be absent from /positions");

const briefStage = positions.indexOf("{step === 6");
const ekenLaunch = positions.indexOf("ПЕРЕДАЧА В EKEN");
if (briefStage < 0 || ekenLaunch < briefStage) errors.push("Eken launch UI must only render after the brief stage");

forbidMatch(
  positions,
  /data-umami-event-(?:title|description|claim|evidence|answer|brief|token|place|position|route|ready|total)=/,
  "Analytics attributes contain a private or non-allowlisted property name",
);
forbidMatch(
  positions,
  /analytics\?\.track\([\s\S]{0,500}?\b(?:title|description|causalClaim|evidence|answers|brief|handoffToken|place|position|step|journey)\s*:/,
  "Programmatic analytics contain a private or non-allowlisted property name",
);

requireMatch(relations, /ALLOWED_QUERY_KEYS/, "Position-map URL key allowlist is missing");
requireMatch(relations, /url\.hash\s*===\s*["']{2}/, "Position-map URL validator must reject fragments");
requireMatch(relations, /signal(?:Id|Value).*test|TECHNICAL_ID|technical/i, "Position-map URL validator must validate technical ID values, not only keys");

if (/buildEkenUrl\(payload\)/.test(positions) && /#route=.*JSON\.stringify/.test(integration)) {
  errors.push("Positions must not serialize the full Eken payload into a URL fragment");
}

if (errors.length) {
  console.error(`Signal-position release validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Signal-position release source contracts passed");
