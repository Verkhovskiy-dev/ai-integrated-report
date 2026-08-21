import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Positions.tsx", import.meta.url), "utf8");

describe("Positions URL state contract", () => {
  it("persists relation route selection in browser history", () => {
    expect(source).toContain('nextUrl.searchParams.set("route", route.id)');
    expect(source).toContain('window.history.pushState({}, "", nextUrl)');
  });

  it("restores both step and route on popstate", () => {
    expect(source).toContain('window.addEventListener("popstate", restoreStep)');
    expect(source).toContain('setRouteId(restoredRoute)');
  });

  it("returns signal entrants to the originating dashboard card", () => {
    expect(source).toContain('"/#signal-position-entry"');
  });
});
