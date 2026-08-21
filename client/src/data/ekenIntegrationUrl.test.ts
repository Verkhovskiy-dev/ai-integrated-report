import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEkenCompatibilityUrl,
  buildEkenIntegrationUrl,
  createEkenHandoff,
  HandoffServiceError,
} from "./ekenIntegrationUrl";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Eken handoff transport", () => {
  it("builds a token-only redirect URL", () => {
    const url = new URL(buildEkenIntegrationUrl("short-lived-token"));
    expect(url.searchParams.get("handoffToken")).toBe("short-lived-token");
    expect(url.hash).toBe("");
    expect(url.href).not.toContain("brief");
  });

  it("builds an explicit compatibility URL from non-content identifiers only", () => {
    const url = buildEkenCompatibilityUrl({
      routeId: "route-1",
      scenarioId: "scenario-1",
      sourceId: "insight:one",
      surface: "insight",
    });
    expect(url).toContain("routeId=route-1");
    expect(url).toContain("handoffStatus=local-preview");
    expect(url).not.toContain("objective");
    expect(url).not.toContain("evidence");
    expect(url).not.toContain("brief");
  });

  it("returns a redirect only after the service creates a token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ handoffToken: "token-123" }),
      { status: 201, headers: { "content-type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createEkenHandoff({ schemaVersion: "2.0" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(result.handoffToken).toBe("token-123");
    expect(new URL(result.redirectUrl).searchParams.get("handoffToken")).toBe("token-123");
  });

  it("retries one network failure with the same serialized payload", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ handoffToken: "retry-token" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { schemaVersion: "2.0", routeId: "same-route" };

    await createEkenHandoff(payload);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[1][1]?.body);
  });

  it("does not retry a service rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createEkenHandoff({ schemaVersion: "2.0" })).rejects.toMatchObject<Partial<HandoffServiceError>>({
      kind: "service",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
