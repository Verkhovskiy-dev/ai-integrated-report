# Weekly insights v2

These files are the source-controlled bodies of the three n8n Code nodes in
`AI Weekly Insights Generator` (`YMwsNBCAbJC1Npfj`).

The v2 contract fixes the production pipeline in four ways:

1. It sends `fact`, `why_important`, and source URLs to the model, not titles only.
2. Every insight must cite 3–5 archive event IDs from at least two report dates.
3. Role recommendations and the minimal Eken brief are generated in the same package.
4. The parser fails closed before the existing GitHub publication node when grounding or
   required fields are missing.

Build an n8n update payload from an exported workflow:

```sh
node automation/weekly-insights/build-workflow-update.mjs current.json update.json
```

The GitHub publication node is deliberately not exported here because the current n8n
workflow still contains a legacy inline token. Move that token into an n8n credential and
rotate it separately; never commit an exported workflow containing credentials.
