import { describe, expect, it } from "vitest";
import { ARCHIVED_INSIGHT_COPY_GENERATED_AT, getArchivedInsightEditorialCopy } from "./insightEditorialCopy";

describe("archived insight editorial copy", () => {
  it("only overlays the exact archived package", () => {
    expect(getArchivedInsightEditorialCopy("financialization-of-ai-compute", "en", ARCHIVED_INSIGHT_COPY_GENERATED_AT)?.title)
      .toBe("AI compute is becoming a financial asset");
    expect(getArchivedInsightEditorialCopy("financialization-of-ai-compute", "en", "2026-09-02T00:00:00.000Z"))
      .toBeUndefined();
  });
});
