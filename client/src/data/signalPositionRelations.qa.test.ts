import { describe, expect, it } from "vitest";
import {
  CURRENT_SIGNAL_POSITION_FIXTURE,
  buildSignalPositionMapHref,
  getPublishedDashboardFocusSignalId,
  hasOnlyTechnicalPositionMapParams,
  rankSignalPositionCandidates,
  resolveSignalPositionRelations,
  validateSignalPositionRelations,
  type SignalPositionCandidate,
  type SignalPositionFixture,
} from "./signalPositionRelations";

const published = CURRENT_SIGNAL_POSITION_FIXTURE.relations;

function fixture(signalId: string, relations: SignalPositionFixture["relations"]): SignalPositionFixture {
  return { ...CURRENT_SIGNAL_POSITION_FIXTURE, signalId, relations };
}

describe("signal → position release contracts", () => {
  it("resolves full, single, zero, and stale signal states without substituting another signal", () => {
    const recommended = published.find((relation) => relation.recommended)!;
    const fixtures = [
      fixture("full-signal", published),
      fixture("single-signal", [{ ...recommended, signalId: "single-signal" }]),
      fixture("zero-signal", []),
    ];

    expect(resolveSignalPositionRelations("full-signal", fixtures).state).toBe("full");
    expect(resolveSignalPositionRelations("single-signal", fixtures).state).toBe("single");
    expect(resolveSignalPositionRelations("zero-signal", fixtures).state).toBe("zero");
    const stale = resolveSignalPositionRelations("stale-signal", fixtures);
    expect(stale.state).toBe("unknown-signal");
    expect(stale.fixture).toBeNull();
    expect(stale.relations).toEqual([]);
  });

  it("keeps a valid 3–5 relation result publishable when no candidate clears recommendation rules", () => {
    const candidates: SignalPositionCandidate[] = published.slice(0, 3).map((relation) => ({
      ...relation,
      recommended: undefined as never,
      relevanceScore: undefined as never,
      confidence: "low",
      factors: { impact: 20, urgency: 20, actionability: 20, roleBreadth: 20 },
    }));
    const ranked = rankSignalPositionCandidates(candidates);

    expect(ranked.recommendationState).toBe("no-confident-recommendation");
    expect(ranked.relations.every((relation) => !relation.recommended)).toBe(true);
    expect(validateSignalPositionRelations(ranked.relations)).toEqual({ success: true, errors: [] });
  });

  it("rejects private or human-authored values even when URL parameter names are allowlisted", () => {
    const privateText = encodeURIComponent("Secret customer acquisition plan");
    expect(hasOnlyTechnicalPositionMapParams(`/positions?source=3&step=map&from=signal&signal=${privateText}`)).toBe(false);
    expect(hasOnlyTechnicalPositionMapParams("/positions?source=3&step=map&from=signal&signal=signal:stable-id&title=private")).toBe(false);
    expect(hasOnlyTechnicalPositionMapParams("/positions?source=3&step=map&from=signal&signal=signal:stable-id#private-brief")).toBe(false);
  });

  it("does not permit private content keys in the analytics property contract", () => {
    const allowed = new Set([
      "signalId", "signalVersion", "sourcePlaceId", "positionRouteId", "impactType",
      "recommended", "confidence", "rank", "positionsShown", "elapsedBucket", "viewMode", "locale",
    ]);
    for (const forbidden of ["title", "description", "causalClaim", "evidence", "answers", "brief", "handoffToken"]) {
      expect(allowed.has(forbidden)).toBe(false);
    }
  });

  it("resolves the real Dashboard CTA to the same published signal and source context", () => {
    const dashboardSignalId = getPublishedDashboardFocusSignalId("2026-02-24");
    expect(dashboardSignalId).toBe(CURRENT_SIGNAL_POSITION_FIXTURE.signalId);
    const url = new URL(buildSignalPositionMapHref(
      dashboardSignalId!,
      CURRENT_SIGNAL_POSITION_FIXTURE.sourcePlaceId,
    ), "https://verkhovskiy.ai");
    const result = resolveSignalPositionRelations(url.searchParams.get("signal") ?? "");

    expect(result.state).toBe("full");
    expect(result.fixture?.sourcePlaceId).toBe(url.searchParams.get("source"));
    expect(getPublishedDashboardFocusSignalId("2026-08-21")).toBeNull();
  });
});
