import { describe, expect, it } from "vitest";
import { POSITION_ROUTES } from "./positionRoutes";
import {
  CURRENT_SIGNAL_POSITION_FIXTURE,
  buildSignalPositionMapHref,
  calculateRelationRelevance,
  hasOnlyTechnicalPositionMapParams,
  getPublishedDashboardFocusSignalId,
  rankSignalPositionCandidates,
  resolveRelationPositionRoute,
  resolveSignalPositionRelations,
  validateSignalPositionRelations,
  type SignalPositionCandidate,
} from "./signalPositionRelations";

describe("signal → position relation data layer", () => {
  it("publishes 3–5 current-signal relations with exactly one explainable recommendation", () => {
    const result = resolveSignalPositionRelations(CURRENT_SIGNAL_POSITION_FIXTURE.signalId);
    expect(result.state).toBe("full");
    expect(result.relations.length).toBeGreaterThanOrEqual(3);
    expect(result.relations.length).toBeLessThanOrEqual(5);
    expect(result.relations.filter((relation) => relation.recommended)).toHaveLength(1);
    expect(result.relations.find((relation) => relation.recommended)?.whyRecommended).toBeTruthy();
  });

  it("resolves only the exact published Dashboard event and fails closed for future dates", () => {
    expect(getPublishedDashboardFocusSignalId("2026-02-24")).toBe("dashboard-focus:2026-02-24:event-4");
    expect(getPublishedDashboardFocusSignalId("2026-02-25")).toBeNull();
    expect(getPublishedDashboardFocusSignalId("2026-02-24", 3)).toBeNull();
    expect(resolveRelationPositionRoute(CURRENT_SIGNAL_POSITION_FIXTURE.relations[0])?.id)
      .toBe(CURRENT_SIGNAL_POSITION_FIXTURE.relations[0].positionRouteId);
    expect(resolveRelationPositionRoute({ positionRouteId: "unknown" })).toBeNull();
  });

  it("keeps every published score in 0–100 and every route resolvable", () => {
    const routeIds = new Set(POSITION_ROUTES.map((route) => route.id));
    CURRENT_SIGNAL_POSITION_FIXTURE.relations.forEach((relation) => {
      expect(relation.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(relation.relevanceScore).toBeLessThanOrEqual(100);
      expect(relation.potentialScore).toBeGreaterThanOrEqual(0);
      expect(relation.potentialScore).toBeLessThanOrEqual(100);
      expect(relation.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(relation.accessibilityScore).toBeLessThanOrEqual(100);
      expect(routeIds.has(relation.positionRouteId)).toBe(true);
    });
    expect(validateSignalPositionRelations(CURRENT_SIGNAL_POSITION_FIXTURE.relations).success).toBe(true);
  });

  it("implements the specified deterministic relevance formula", () => {
    const factors = { impact: 80, urgency: 60, actionability: 90, roleBreadth: 50 };
    expect(calculateRelationRelevance(factors, "medium")).toBe(72);
    expect(calculateRelationRelevance(factors, "medium")).toBe(72);
  });

  it("is deterministic even when candidates tie", () => {
    const base = CURRENT_SIGNAL_POSITION_FIXTURE.relations[0];
    const candidate = (positionRouteId: string): SignalPositionCandidate => ({
      ...base,
      positionRouteId,
      recommended: undefined as never,
      relevanceScore: undefined as never,
      whyRecommended: "Measurable route",
      factors: { impact: 70, urgency: 70, actionability: 70, roleBreadth: 70 },
    });
    const input = [candidate("data-access-architect"), candidate("content-provenance-engineer")];
    const first = rankSignalPositionCandidates(input).relations.map((relation) => relation.positionRouteId);
    const second = rankSignalPositionCandidates([...input].reverse()).relations.map((relation) => relation.positionRouteId);
    expect(first).toEqual(second);
  });

  it("never recommends low-confidence or below-threshold candidates", () => {
    const published = CURRENT_SIGNAL_POSITION_FIXTURE.relations[0];
    const low: SignalPositionCandidate = {
      ...published,
      recommended: undefined as never,
      relevanceScore: undefined as never,
      confidence: "low",
      factors: { impact: 100, urgency: 100, actionability: 100, roleBreadth: 100 },
    };
    const weak: SignalPositionCandidate = {
      ...low,
      positionRouteId: "data-access-architect",
      confidence: "medium",
      factors: { impact: 0, urgency: 0, actionability: 0, roleBreadth: 0 },
    };
    const ranked = rankSignalPositionCandidates([low, weak]);
    expect(ranked.recommendation).toBeNull();
    expect(ranked.recommendationState).toBe("no-confident-recommendation");
    expect(ranked.relations.every((relation) => !relation.recommended)).toBe(true);
    expect(validateSignalPositionRelations([
      ...ranked.relations,
      { ...ranked.relations[0], positionRouteId: "ai-agent-audit" },
    ]).success).toBe(true);
  });

  it("fails closed for unknown routes and unknown signals", () => {
    const relation = CURRENT_SIGNAL_POSITION_FIXTURE.relations[0];
    expect(validateSignalPositionRelations([{ ...relation, positionRouteId: "missing-route" }]).success).toBe(false);
    expect(() => rankSignalPositionCandidates([{
      ...relation,
      recommended: undefined as never,
      relevanceScore: undefined as never,
      positionRouteId: "missing-route",
      factors: { impact: 80, urgency: 80, actionability: 80, roleBreadth: 80 },
    }])).toThrow("Unknown positionRouteId");
    expect(resolveSignalPositionRelations("missing-signal").state).toBe("unknown-signal");
  });

  it("supports an honest single fallback and rejects an unexplained pair", () => {
    const recommended = CURRENT_SIGNAL_POSITION_FIXTURE.relations.find((relation) => relation.recommended)!;
    const singleFixture = { ...CURRENT_SIGNAL_POSITION_FIXTURE, signalId: "single", relations: [recommended] };
    expect(resolveSignalPositionRelations("single", [singleFixture]).state).toBe("single");
    expect(validateSignalPositionRelations(CURRENT_SIGNAL_POSITION_FIXTURE.relations.slice(0, 2)).success).toBe(false);
  });

  it("builds an allowlisted technical URL without raw signal text", () => {
    const rawText = "Secret customer context must never enter the URL";
    const href = buildSignalPositionMapHref(CURRENT_SIGNAL_POSITION_FIXTURE.signalId, CURRENT_SIGNAL_POSITION_FIXTURE.sourcePlaceId);
    const url = new URL(href, "https://verkhovskiy.ai");
    const keys: string[] = [];
    url.searchParams.forEach((_value, key) => keys.push(key));
    expect(hasOnlyTechnicalPositionMapParams(href)).toBe(true);
    expect(keys.sort()).toEqual(["from", "signal", "source", "step"]);
    expect(href).not.toContain(encodeURIComponent(rawText));
    expect(href).not.toContain("title=");
    expect(href).not.toContain("description=");
    expect(() => buildSignalPositionMapHref(rawText, "srt7-content-provenance-tech")).toThrow("technical identifiers only");
    expect(hasOnlyTechnicalPositionMapParams("/positions?source=place&step=map&from=signal&signal=Secret%20plan")).toBe(false);
    expect(hasOnlyTechnicalPositionMapParams(`${href}#private-context`)).toBe(false);
    expect(hasOnlyTechnicalPositionMapParams(`${href}&signal=duplicate`)).toBe(false);
  });
});
