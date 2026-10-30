# Isolated open-tab refresh check

Run `npx vite --config tests/live-refresh/vite.config.ts`, then open
`http://127.0.0.1:4198/?view=executive`.

This harness mounts the real LiveDataProvider, ExecutiveDataProvider,
FilterProvider and LatestNews component. All `/data/*` and `/api/*` requests
terminate in the local fixture middleware. It does not load site analytics,
external widgets or production services. Reaction API is deliberately unavailable;
do not interpret its local error as a production regression.

1. With release A displayed, enter `News` in the search field and expand a card.
2. Stage B-stale-executive. Keep the tab visible for at least 60 seconds.
   Report B must replace A without changing Document ID, search or expansion.
   Explanation for the unchanged first event must become unavailable because
   its old package belongs to A's root version.
3. Stage B, then use Test focus event (or return to this tab). B's explanation
   must recover automatically; Document ID remains unchanged.
4. Stage error, malformed and older in turn, triggering Test focus event each
   time. Last-known-good B must remain. Restore B and verify the error clears.
5. Switch locale. Only the matching locale/version explanation may be shown;
   search and the page document remain intact.

Test focus event emits a local focus event to exercise the real resume handler;
the minute polling step is independent of that test button. Hidden/offline,
timeout, serialization and listener cleanup are covered with fake browser events
and timers in `client/src/lib/liveRefresh.test.ts`.

Regression commands:

```sh
npx vitest run --config vite.config.ghpages.ts client/src/lib/liveRefresh.test.ts client/src/data/newsContract.test.ts client/src/contexts/FilterContext.test.ts client/src/contexts/ViewModeContext.test.ts
node --test scripts/news-contract/news-contract.test.mjs scripts/news-contract/validate-published-pair.test.mjs
node --import tsx --test shared/newsIdentity.test.ts client/src/lib/newsReactions.test.ts
npx tsc --noEmit
npx vite build --config vite.config.ghpages.ts
```
