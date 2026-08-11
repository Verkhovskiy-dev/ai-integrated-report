import { describe, expect, it } from "vitest";
import {
  POSITION_ROUTES,
  buildEkenPayload,
  buildEkenUrl,
} from "./positionRoutes";

describe("Verkhovskiy → Eken position handoff", () => {
  it("matches the PositionRouteV1 contract consumed by Eken", () => {
    const payload = buildEkenPayload(POSITION_ROUTES[0], "expert");

    expect(payload.schemaVersion).toBe("1.0");
    expect(payload.locale).toBe("ru");
    expect(payload.routeId).toBeTruthy();
    expect(payload.place.id).toBe("ai-agent-audit");
    expect(payload.position.name).toBe("Аудитор AI-агентов");
    expect(payload.firstAction.acceptanceCriterion).toBeTruthy();
    expect(payload.resourceGap.title).toBeTruthy();
    expect(payload.arsenal.platforms.length).toBeGreaterThan(0);
  });

  it("keeps the payload in the URL fragment instead of the request URL", () => {
    const payload = buildEkenPayload(POSITION_ROUTES[2], "invest");
    const url = new URL(buildEkenUrl(payload));
    const restored = JSON.parse(new URLSearchParams(url.hash.slice(1)).get("route") ?? "null");

    expect(url.pathname).toBe("/integrations/verkhovskiy");
    expect(url.search).toBe("");
    expect(restored).toEqual(payload);
  });
});
