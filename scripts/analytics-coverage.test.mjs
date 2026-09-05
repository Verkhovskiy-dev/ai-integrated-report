import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareSeo, routes } from './prepare-seo.mjs';
import { validateSharedAnalytics } from './validate-shared-analytics.mjs';

test('all generated application routes retain one shared loader and no duplicate Umami/placeholder GA', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'growth-analytics-'));
  try {
    fs.copyFileSync(new URL('../client/index.html', import.meta.url), path.join(dir, 'index.html'));
    prepareSeo(dir);
    for (const route of ['/', ...Object.keys(routes), '/404.html']) {
      const file = route.endsWith('.html') ? path.join(dir, route) : path.join(dir, route, 'index.html');
      const html = fs.readFileSync(file, 'utf8');
      assert.equal((html.match(/src="\/analytics.js"/g) || []).length, 1, route);
      assert(!html.includes('G-XXXXXXXXXX'), route);
      assert(!html.includes('cloud.umami.is/script.js'), route);
    }
    const missing = path.join(dir, 'missing.js');
    assert.throws(() => validateSharedAnalytics(missing));
    fs.writeFileSync(missing, '/* empty or wrong shared script */');
    assert.throws(() => validateSharedAnalytics(missing), /missing expected marker/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
