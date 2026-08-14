import { describe, expect, it } from "vitest";
import {
  POSITION_ROUTES,
  SRT_PLACES,
  buildEkenPayload,
  buildEkenUrl,
  resolvePositionRoute,
} from "./positionRoutes";
import {
  EKEN_ROUTE_REGISTRY,
  buildPositionRouteHref,
  getEkenRouteForPlace,
} from "./ekenRouteRegistry";

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

  it("resolves every Eken route to its own SRT place", () => {
    const placeIds = POSITION_ROUTES.flatMap((route) => route.sourcePlaceIds);

    expect(placeIds).toHaveLength(4);
    expect(placeIds.every((placeId) => SRT_PLACES[placeId]?.id === placeId)).toBe(true);
  });

  it("keeps the selected place in the Eken handoff for every available route", () => {
    POSITION_ROUTES.forEach((route) => {
      const place = SRT_PLACES[route.sourcePlaceIds[0]];
      const payload = buildEkenPayload(route, route.intents[0], undefined, { place });

      expect(payload.place.id).toBe(place.id);
      expect(payload.place.name).toBe(place.name);
      expect(payload.position.name).toBe(route.position);
    });
  });

  it("uses the public Eken registry as the single place-to-position mapping", () => {
    const enabledRoutes = EKEN_ROUTE_REGISTRY.routes.filter((route) => route.enabled);

    expect(enabledRoutes).toHaveLength(4);
    enabledRoutes.forEach((entry) => {
      const positionRoute = POSITION_ROUTES.find((route) => route.id === entry.positionRouteId);

      expect(SRT_PLACES[entry.placeId]?.id).toBe(entry.placeId);
      expect(positionRoute?.sourcePlaceIds).toContain(entry.placeId);
      expect(getEkenRouteForPlace(entry.placeId)).toEqual(entry);
    });
  });

  it("builds an explicit deep link for every enabled card", () => {
    EKEN_ROUTE_REGISTRY.routes.filter((route) => route.enabled).forEach((entry) => {
      const url = new URL(buildPositionRouteHref(entry), "https://verkhovskiy.ai");

      expect(url.pathname).toBe("/positions");
      expect(url.searchParams.get("place")).toBe(entry.placeId);
      expect(url.searchParams.get("route")).toBe(entry.positionRouteId);
      expect(url.searchParams.get("source")).toBe("places");
    });
  });

  it("fails closed for an unknown place or a mismatched route", () => {
    expect(resolvePositionRoute("srt5-vertical-fin-ai", "vertical-finance-ai")?.position)
      .toBe("Оператор финансового AI-агента");
    expect(resolvePositionRoute("srt5-vertical-fin-ai", "ai-agent-audit")).toBeNull();
    expect(resolvePositionRoute("missing-place", "ai-agent-audit")).toBeNull();
  });
});
