// Local preview only. Never deploy this server; it cannot run news generation.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const fixtures = path.resolve(root, '..', 'fixtures');
const states = new Map<string, any>();

export default defineConfig({
  root: path.join(root, 'client'),
  cacheDir: path.join(root, '.cache/preview-vite'),
  envDir: fixtures,
  define: { 'import.meta.env.VITE_REACTIONS_API_BASE': JSON.stringify('') },
  resolve: { alias: { '@': path.join(root, 'client/src'), '@shared': path.join(root, 'shared'), '@assets': path.join(root, 'attached_assets') } },
  plugins: [react(), tailwindcss(), {
    name: 'isolated-news-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Prevent analytics, production reactions and any other remote API calls.
        res.setHeader('Content-Security-Policy', "connect-src 'self' ws://127.0.0.1:4197; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'");
        const url = new URL(req.url || '/', 'http://127.0.0.1:4197');
        if (url.pathname === '/analytics.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('/* Disabled in isolated local preview. */'); return; }
        if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
          const suffix = url.pathname.slice(6);
          if (suffix.includes('..')) { res.statusCode = 400; res.end(); return; }
          const fixture = path.join(fixtures, suffix);
          const fallback = path.join(root, 'data', suffix);
          const file = fs.existsSync(fixture) ? fixture : fallback;
          if (fs.existsSync(file) && fs.statSync(file).isFile()) { res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-cache'); fs.createReadStream(file).pipe(res); return; }
        }
        if (url.pathname === '/api/reactions/current' && req.method === 'GET') {
          const identity = { browserId: url.searchParams.get('browserId'), newsId: url.searchParams.get('newsId'), contentVersion: url.searchParams.get('contentVersion') };
          const key = JSON.stringify(identity);
          res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Preview-Only', 'in-memory');
          res.end(JSON.stringify({ ok: true, state: states.get(key) || { ...identity, reaction: null, revision: 0, updatedAt: null, lastEventId: null } })); return;
        }
        if (url.pathname === '/api/reactions/events' && req.method === 'POST') {
          let body = ''; req.on('data', chunk => { body += chunk; }); req.on('end', () => {
            try {
              const intent = JSON.parse(body); const identity = { browserId: intent.browserId, newsId: intent.newsId, contentVersion: intent.contentVersion }; const key = JSON.stringify(identity);
              const state = { ...identity, reaction: intent.reaction, revision: (states.get(key)?.revision || 0) + 1, updatedAt: new Date().toISOString(), lastEventId: intent.eventId };
              states.set(key, state); res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Preview-Only', 'in-memory'); res.end(JSON.stringify({ ok: true, state, duplicate: false, serverTimestamp: state.updatedAt }));
            } catch { res.statusCode = 400; res.end('{}'); }
          }); return;
        }
        if (url.pathname.startsWith('/api/')) { res.statusCode = 403; res.end('Local preview: endpoint disabled'); return; }
        next();
      });
    },
  }],
  server: { host: '127.0.0.1', port: 4197, strictPort: true, fs: { allow: [root] } },
  build: { outDir: path.join(root, 'dist-preview'), emptyOutDir: true },
});
