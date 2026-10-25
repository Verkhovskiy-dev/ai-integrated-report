# AIwatcher producer contract patch (not applied)

Confirmed read-only workflow: `VkwZ7WozwG7g3cuV`, active version `6f1c9134-84c7-423f-866c-4397ce0ae7a2`.

Current path is `AI Agent → Parse Report to JSON → Check Level Fill → Merge with SHA → Validate Report → Publication Gate → Push JSON to GitHub`. There is no confirmed current executive-data generator. The published `executive_data_ru.json` is a static 2026-03 artifact and must not be copied onto current events.

Before `Validate Report`, insert an adapter equivalent to `scripts/news-contract/build-paired-news-data.mjs`:

1. Use source URL or upstream `source_event_id` to generate/preserve `news_id`; never title or position.
2. Generate `content_version` from current displayed facts, interpretation, source set, related levels and explicit importance.
3. Keep `importance` as `null` when the model did not assess it. If present it must be `{level: critical|high|medium|low, rationale: non-empty}`. SRT level is never a substitute.
4. Emit one executive availability record per event. An optional model-produced `executive_explanation` becomes `available` only when all three text fields are nonempty and its producer-supplied `content_version` equals the version computed from that exact event. Missing or mismatched binding emits `unavailable`; the adapter must never restamp inherited explanation text.
5. Write both data files only after `validatePairedPayload` succeeds. Reject duplicate IDs, orphan explanations, mismatched versions and invalid importance.

Required AI Agent output additions per event:

```json
{
  "importance": {"level":"high","rationale":"..."},
  "executive_explanation": {
    "content_version":"version supplied to a second-stage explanation generator",
    "what_happened":"...",
    "why_important":"...",
    "business_impact":"..."
  }
}
```

Both keys are optional. Their absence must produce `importance: null` and an explicit unavailable executive record. The current single-stage producer does not receive a computed event version, so its inline explanation must remain unavailable until a version-bound second stage is implemented. This document is a reviewable patch specification only: no n8n workflow or writer was changed or executed.
