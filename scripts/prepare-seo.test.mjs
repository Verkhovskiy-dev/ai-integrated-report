import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSeo, routes} from './prepare-seo.mjs';

test('materializes routes, preserves reports/verification, fixes sitemap, is idempotent', () => {
 const site=fs.mkdtempSync(path.join(os.tmpdir(),'seo-test-'));
 try {
  fs.writeFileSync(path.join(site,'index.html'),'<html><head><title>Test</title><meta name="description" content="Old"></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>');
  fs.writeFileSync(path.join(site,'sitemap.xml'),'<urlset><url><loc>https://verkhovskiy.ai/programs</loc></url><url><loc>https://verkhovskiy.ai/reports/2026-09-04/</loc></url></urlset>');
  fs.writeFileSync(path.join(site,'robots.txt'),'User-agent: *\nAllow: /');
  fs.writeFileSync(path.join(site,'google68d8f18ce7702db4.html'),'verification');
  fs.mkdirSync(path.join(site,'reports'));fs.writeFileSync(path.join(site,'reports/index.html'),'untouched');
  prepareSeo(site);
  const snapshot = {};
  for (const route of Object.keys(routes)) {
   const file=path.join(site,route,'index.html'), html=fs.readFileSync(file,'utf8'); snapshot[file]=html;
   assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
   assert(html.includes(`href="https://verkhovskiy.ai${route}"`)); assert(!html.includes('noindex'));
   assert(html.includes('/assets/app.js')); assert(html.includes('href="/reports/"')); assert(html.includes('href="/favicon.png"'));
  }
  prepareSeo(site);
  for(const [file,html] of Object.entries(snapshot)) assert.equal(fs.readFileSync(file,'utf8'),html);
  assert(fs.readFileSync(path.join(site,'404.html'),'utf8').includes('noindex,follow'));
  assert.equal(fs.readFileSync(path.join(site,'reports/index.html'),'utf8'),'untouched');
  assert.equal(fs.readFileSync(path.join(site,'google68d8f18ce7702db4.html'),'utf8'),'verification');
  assert(fs.readFileSync(path.join(site,'sitemap.xml'),'utf8').includes('/programs/</loc>'));
  assert.equal(fs.readFileSync(path.join(site,'favicon.png')).readUInt32BE(16),192);
 } finally { fs.rmSync(site,{recursive:true,force:true}); }
});
