# Local-only inline cards

Run `./node_modules/.bin/vite --config preview/vite.config.ts` from this isolated worktree.
URL: http://127.0.0.1:4197/?view=executive#news

This serves the real candidate source with the saved 31 October public report in ../fixtures, not a live content run. RU/EN snapshot hashes are in ../FIXTURES.json. No .env credentials are read. Analytics are disabled; CSP blocks external connections. Reactions use local disposable in-memory state. Production generation, schedules and canonical data are not touched. Do not deploy this preview server.

The older modal compact preview at4196 is rejected and is not this candidate.
