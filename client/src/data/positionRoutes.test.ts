import { describe, expect, it } from "vitest";
import {
  POSITION_ROUTES,
  SRT_PLACES,
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

  it("keeps one journey id and the actual SRT place through the handoff", () => {
    const payload = buildEkenPayload(
      POSITION_ROUTES[0],
      "expert",
      undefined,
      { routeId: "journey-123", createdAt: "2026-08-12T09:00:00.000Z", place: SRT_PLACES["3"] },
    );

    expect(payload.routeId).toBe("journey-123");
    expect(payload.createdAt).toBe("2026-08-12T09:00:00.000Z");
    expect(payload.place).toMatchObject({
      id: "srt3-ai-curation-agencies",
      level: 3,
      name: "Агентства по аудиту и кураторству ИИ-систем",
    });
  });

  it("keeps source-backed market analytics on the pilot position", () => {
    const market = POSITION_ROUTES[0].marketAnalysis;

    expect(market?.confidence).toBe("Средняя");
    expect(market?.buyers).toHaveLength(4);
    expect(market?.geographies.map((item) => item.market)).toEqual([
      "США",
      "ЕС",
      "Великобритания",
    ]);
    expect(market?.compensation[0]).toMatchObject({
      market: "США",
      range: "$140–218 тыс. / год",
    });
    expect(market?.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
  });
});
