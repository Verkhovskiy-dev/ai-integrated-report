# Local executive-generation stage

This stage is a filesystem-only release candidate. It does not activate n8n,
publish, deploy, schedule work, or write analytics. It connects the saved
producer parser/validator source to a bounded model call and the paired
news/executive contract.

## Contract

- Input is 3–5 source-backed items. Source identity establishes `news_id`.
- `input_hash` binds the exact source facts, scope, unknowns, date and sources
  sent to the model. The model must echo both identifiers unchanged.
- The model returns Russian explanation fields plus an independent importance
  assessment. SRT taxonomy is classified separately and is absent from the
  prompt payload.
- Only after response validation does the pipeline compute the event
  `content_version`, including accepted importance and `why_important`, and
  attach the fresh explanation to that version.
- Timeout, process error, malformed output, tool use, partial/duplicate/orphan
  IDs, wrong hashes, invalid importance or unsupported numeric quantities fail
  before the `pair/` directory is atomically committed.

The Codex CLI adapter uses the existing ChatGPT login, ignores user config and
rules, requests a read-only sandbox, disables shell/browser/MCP/plugin/memory
features, and rejects a receipt containing any tool call. This is strong
tool-level isolation, but it is not presented as a separately proven host-level
read sandbox. Prompts must therefore contain public source input only.

## Reproduction

Run the synthetic fail-closed suite without model access:

```sh
npm run test:executive-generation
```

Run one authorised local batch (writes only below the supplied output path):

```sh
node scripts/executive-generation/pipeline.mjs \
  --input test-fixtures/executive-generation/INPUTS-v2.json \
  --srt-map automation/executive-generation/srt-mapping.json \
  --baseline test-fixtures/news-contract/current-2026-10-25.json \
  --out /private/tmp/executive-generation-run \
  --timeout-ms 120000
```

The `05-provider-response.json`, provider JSONL/stderr, paired files and
`RUN-MANIFEST.json` are separate evidence. A synthetic test double is never
labelled as actual inference.
