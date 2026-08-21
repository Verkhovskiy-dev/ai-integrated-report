import { describe, expect, it } from "vitest";
import { readFiltersFromSearch } from "./FilterContext";

describe("readFiltersFromSearch", () => {
  it("reads reproducible query and sorted valid levels", () => {
    expect(readFiltersFromSearch("?q=AI+agents&levels=6,3,6,12,invalid")).toEqual({
      searchQuery: "AI agents",
      selectedLevels: [3, 6],
    });
  });

  it("uses empty filters for missing parameters", () => {
    expect(readFiltersFromSearch("?view=executive")).toEqual({
      searchQuery: "",
      selectedLevels: [],
    });
  });
});
