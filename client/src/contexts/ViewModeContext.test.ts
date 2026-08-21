import { describe, expect, it } from "vitest";
import { resolveViewMode } from "./ViewModeContext";

describe("resolveViewMode", () => {
  it("gives a valid URL mode priority over storage", () => {
    expect(resolveViewMode("?view=expert", "executive")).toBe("expert");
  });

  it("falls back to storage when URL has no valid mode", () => {
    expect(resolveViewMode("?view=unknown", "executive")).toBe("executive");
  });

  it("defaults to expert", () => {
    expect(resolveViewMode("", null)).toBe("expert");
  });
});
