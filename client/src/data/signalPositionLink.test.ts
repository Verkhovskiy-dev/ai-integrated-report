import { describe, expect, it } from "vitest";
import { buildSignalPositionHref, linkSignalToPosition } from "./signalPositionLink";

describe("signal to position map", () => {
  it("routes legal model disputes to the regulatory layer", () => {
    expect(linkSignalToPosition("Конфликт допустимого заимствования", "legal pressure and watermarking").source).toBe(5);
  });

  it("routes agent orchestration signals to the agentic platform", () => {
    expect(linkSignalToPosition("Agent orchestration becomes a market").source).toBe(3);
  });

  it("builds a reproducible technical URL without signal text", () => {
    const link = linkSignalToPosition("GPU infrastructure investment");
    const url = new URL(buildSignalPositionHref(link, "dashboard-focus:2026-08-21:event-4"), "https://verkhovskiy.ai");
    expect(url.pathname).toBe("/positions");
    expect(url.searchParams.get("step")).toBe("map");
    expect(url.searchParams.get("from")).toBe("signal");
    expect(url.href).not.toContain("GPU");
  });
});
