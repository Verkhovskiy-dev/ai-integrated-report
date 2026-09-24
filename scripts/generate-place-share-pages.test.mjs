import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = await mkdtemp(path.join(tmpdir(), "place-share-pages-"));
const placeId = "srt3-test-place";

try {
  const placesPath = path.join(root, "places_data.json");
  await writeFile(placesPath, JSON.stringify({
    places: [{
      id: placeId,
      name: "Тестовое место",
      description: "Описание тестового места",
      srt_level: 3,
      srt_level_name: "Тестовый уровень",
      capacity: { category: "medium" },
      window: { category: "open" },
    }],
  }));

  await execFileAsync(process.execPath, [
    path.resolve("scripts/generate-place-share-pages.mjs"),
    placesPath,
    root,
    "https://example.test",
  ]);

  const html = await readFile(path.join(root, "share", "v1", "places", placeId, "index.html"), "utf8");
  assert.match(html, /allowedUtmParameters=\["utm_source","utm_medium","utm_campaign","utm_content","utm_term"\]/);
  assert.match(html, /destination\.searchParams\.set\(parameter,value\)/);
  assert.match(html, /document\.querySelector\("\.dashboard"\)\.href=destinationHref/);
  assert.match(html, /if\(!shareParameters\.has\("preview"\)\)setTimeout\(\(\)=>location\.replace\(destinationHref\),250\)/);
  assert.doesNotMatch(html, /redirect/);
  console.log("Place share pages preserve only approved UTM parameters");
} finally {
  await rm(root, { recursive: true, force: true });
}
