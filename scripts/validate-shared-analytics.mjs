import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// The shared asset is maintained by the independently published gh-pages site.
// Fail before deploying HTML if that dependency disappears or changes counters.
export function validateSharedAnalytics(file) {
  const code = fs.readFileSync(file, 'utf8');
  for (const marker of ['af3768d0-f56a-406c-9d77-cf20b803f6b9', '111316059', 'cloud.umami.is/script.js', 'mc.yandex.ru/metrika/tag.js']) {
    if (!code.includes(marker)) throw new Error(`Shared analytics missing expected marker: ${marker}`);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) validateSharedAnalytics(process.argv[2]);
