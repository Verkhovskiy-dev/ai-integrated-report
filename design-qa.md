# Design QA — LLM map → EkenLab practice

Final result: passed

## Visual target

- Reference: `exec-a79af1f2-4d73-47fe-abc9-00ac9417f0c4.png`
- Implementation: `qa-llm-practice-drawer.png`
- Default-map discovery state: `qa-llm-practice-default.png`
- Side-by-side comparison: `qa-comparison-map-drawer.png`
- Viewport used for final comparison: 1440 × 1024

## QA rounds

1. The first pass exposed unclear symbol-only controls and decorative checklist glyphs. Replaced them with a labelled **Закрыть** control and quiet left-border emphasis for prerequisites.
2. The final pass confirmed the intended hierarchy: selected card → explicit first-result promise → duration and output → EkenLab CTA. The drawer matches the chosen dark, mint-accented direction while preserving the live map behind it.

## Interaction checks

- The practice-enabled card appears first in the unfiltered catalogue; role and category filters continue to narrow the complete list normally.
- The card is visibly distinct without hiding the rest of the catalogue.
- **Получить первый результат · 35 мин** opens the drawer.
- **Закрыть** returns the user to the same filtered map state.
- The production CTA serializes the versioned route contract and targets the existing EkenLab integration URL.

## Console and layout checks

- No runtime errors in the implemented flow.
- One pre-existing Tailwind CDN warning remains on the static map; it is unrelated to this route.
- Static JSON, inline JavaScript and `git diff --check` pass.
- Drawer CSS includes a full-width small-screen state; temporary browser viewport emulation did not resize the existing desktop tab, so the breakpoint was also verified from the implemented media rule.
