import { POSITION_ROUTES, type PositionRoute } from "./positionRoutes";

export type ImpactType = "created" | "strengthened" | "weakened" | "verify";
export type RelationConfidence = "low" | "medium" | "high";
export type RelationHorizon = "now" | "30d" | "quarter" | "12m";

export interface SignalPositionEvidenceRef {
  id: string;
  url: string;
  publisher: string;
  publishedAt: string;
  claimIds: string[];
}

export interface SignalPositionRelation {
  signalId: string;
  signalVersion: string;
  sourcePlaceId: string;
  positionRouteId: string;
  impactType: ImpactType;
  recommended: boolean;
  relevanceScore: number;
  potentialScore: number;
  accessibilityScore: number;
  horizon: RelationHorizon;
  causalClaim: string;
  whyRecommended?: string;
  counterargument: string;
  evidenceRefs: SignalPositionEvidenceRef[];
  confidence: RelationConfidence;
  updatedAt: string;
}

export interface RelationRankingFactors {
  impact: number;
  urgency: number;
  actionability: number;
  roleBreadth: number;
}

export interface SignalPositionCandidate extends Omit<SignalPositionRelation, "recommended" | "relevanceScore" | "whyRecommended"> {
  factors: RelationRankingFactors;
  whyRecommended?: string;
}

export interface RankedSignalPositions {
  relations: SignalPositionRelation[];
  recommendation: SignalPositionRelation | null;
  recommendationState: "recommended" | "no-confident-recommendation";
}

export interface SignalPositionFixture {
  signalId: string;
  signalVersion: string;
  sourcePlaceId: string;
  title: string;
  causalSummary: string;
  relations: SignalPositionRelation[];
}

export type SignalPositionResolution =
  | { state: "full"; fixture: SignalPositionFixture; relations: SignalPositionRelation[] }
  | { state: "single"; fixture: SignalPositionFixture; relations: [SignalPositionRelation]; message: string }
  | { state: "zero"; fixture: SignalPositionFixture; relations: []; message: string }
  | { state: "unknown-signal"; fixture: null; relations: []; message: string }
  | { state: "invalid"; fixture: SignalPositionFixture; relations: []; errors: string[]; message: string };

const CONFIDENCE_SCORE: Record<RelationConfidence, number> = { low: 30, medium: 70, high: 100 };
const ALLOWED_QUERY_KEYS = new Set(["source", "step", "from", "signal"]);
const TECHNICAL_ID = /^[A-Za-z0-9._:-]{1,200}$/;

function isScore(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export function calculateRelationRelevance(factors: RelationRankingFactors, confidence: RelationConfidence) {
  const values = [factors.impact, factors.urgency, factors.actionability, factors.roleBreadth];
  if (!values.every(isScore)) throw new RangeError("Ranking factors must be finite scores from 0 to 100");
  return Math.round(
    0.30 * factors.impact
    + 0.25 * CONFIDENCE_SCORE[confidence]
    + 0.20 * factors.urgency
    + 0.15 * factors.actionability
    + 0.10 * factors.roleBreadth,
  );
}

function routeSupportsRecommendation(route: PositionRoute | undefined) {
  return Boolean(route?.firstAction.trim() && route.acceptanceCriterion.trim());
}

export function rankSignalPositionCandidates(
  candidates: SignalPositionCandidate[],
  routes: readonly PositionRoute[] = POSITION_ROUTES,
): RankedSignalPositions {
  const routeIds = new Set(routes.map((route) => route.id));
  const scored = candidates.map((candidate) => {
    if (!routeIds.has(candidate.positionRouteId)) {
      throw new Error(`Unknown positionRouteId: ${candidate.positionRouteId}`);
    }
    const { factors, whyRecommended, ...relation } = candidate;
    return {
      ...relation,
      relevanceScore: calculateRelationRelevance(factors, candidate.confidence),
      recommended: false,
      whyRecommended,
    } satisfies SignalPositionRelation;
  }).sort((left, right) =>
    right.relevanceScore - left.relevanceScore
    || right.potentialScore - left.potentialScore
    || right.accessibilityScore - left.accessibilityScore
    || left.positionRouteId.localeCompare(right.positionRouteId),
  );

  const recommendation = scored.find((relation) =>
    relation.relevanceScore >= 60
    && relation.confidence !== "low"
    && routeSupportsRecommendation(routes.find((route) => route.id === relation.positionRouteId)),
  ) ?? null;

  const relations = scored.map((relation) => ({
    ...relation,
    recommended: relation.positionRouteId === recommendation?.positionRouteId,
    whyRecommended: relation.positionRouteId === recommendation?.positionRouteId
      ? relation.whyRecommended
      : undefined,
  }));

  return {
    relations,
    recommendation: recommendation
      ? relations.find((relation) => relation.positionRouteId === recommendation.positionRouteId) ?? null
      : null,
    recommendationState: recommendation ? "recommended" : "no-confident-recommendation",
  };
}

export function resolveRelationPositionRoute(
  relation: Pick<SignalPositionRelation, "positionRouteId">,
  routes: readonly PositionRoute[] = POSITION_ROUTES,
) {
  return routes.find((route) => route.id === relation.positionRouteId) ?? null;
}

export function validateSignalPositionRelations(
  relations: readonly SignalPositionRelation[],
  routes: readonly PositionRoute[] = POSITION_ROUTES,
) {
  const errors: string[] = [];
  const routeIds = new Set(routes.map((route) => route.id));
  if (!(relations.length === 0 || relations.length === 1 || (relations.length >= 3 && relations.length <= 5))) {
    errors.push("A published signal must have 3–5 relations, one honest fallback, or zero confirmed relations");
  }
  const recommended = relations.filter((relation) => relation.recommended);
  if (recommended.length > 1) errors.push("At most one relation may be recommended");
  if (recommended.some((relation) => relation.confidence === "low")) errors.push("Low-confidence relation cannot be recommended");
  if (recommended.some((relation) => relation.relevanceScore < 60)) errors.push("Recommended relation must have relevanceScore >= 60");

  const uniqueRoutes = new Set<string>();
  for (const relation of relations) {
    if (!routeIds.has(relation.positionRouteId)) errors.push(`Unknown positionRouteId: ${relation.positionRouteId}`);
    if (uniqueRoutes.has(relation.positionRouteId)) errors.push(`Duplicate positionRouteId: ${relation.positionRouteId}`);
    uniqueRoutes.add(relation.positionRouteId);
    if (![relation.relevanceScore, relation.potentialScore, relation.accessibilityScore].every(isScore)) {
      errors.push(`Scores must be from 0 to 100: ${relation.positionRouteId}`);
    }
    if (!relation.causalClaim.trim() || !relation.counterargument.trim()) {
      errors.push(`Causal claim and counterargument are required: ${relation.positionRouteId}`);
    }
    if (relation.recommended && !relation.whyRecommended?.trim()) {
      errors.push(`whyRecommended is required for recommendation: ${relation.positionRouteId}`);
    }
    if (relation.recommended && !routeSupportsRecommendation(routes.find((route) => route.id === relation.positionRouteId))) {
      errors.push(`Recommended route needs a measurable action and acceptance criterion: ${relation.positionRouteId}`);
    }
    for (const evidence of relation.evidenceRefs) {
      try {
        const url = new URL(evidence.url);
        if (url.protocol !== "https:") errors.push(`Evidence URL must use HTTPS: ${evidence.id}`);
      } catch {
        errors.push(`Invalid evidence URL: ${evidence.id}`);
      }
      if (!evidence.claimIds.length) errors.push(`Evidence must reference at least one claim: ${evidence.id}`);
    }
  }
  return { success: errors.length === 0, errors };
}

export function buildSignalPositionMapHref(signalId: string, sourcePlaceId: string) {
  if (!TECHNICAL_ID.test(signalId) || !TECHNICAL_ID.test(sourcePlaceId)) {
    throw new Error("Position map URL accepts technical identifiers only");
  }
  const params = new URLSearchParams({ source: sourcePlaceId, step: "map", from: "signal", signal: signalId });
  return `/positions?${params.toString()}`;
}

export function hasOnlyTechnicalPositionMapParams(href: string) {
  const url = new URL(href, "https://verkhovskiy.ai");
  let onlyAllowedKeys = true;
  let parameterCount = 0;
  url.searchParams.forEach((_value, key) => {
    parameterCount += 1;
    if (!ALLOWED_QUERY_KEYS.has(key)) onlyAllowedKeys = false;
  });
  return url.pathname === "/positions"
    && url.hash === ""
    && onlyAllowedKeys
    && parameterCount === ALLOWED_QUERY_KEYS.size
    && url.searchParams.getAll("source").length === 1
    && url.searchParams.getAll("step").length === 1
    && url.searchParams.getAll("from").length === 1
    && url.searchParams.getAll("signal").length === 1
    && url.searchParams.get("from") === "signal"
    && url.searchParams.get("step") === "map"
    && TECHNICAL_ID.test(url.searchParams.get("signal") ?? "")
    && TECHNICAL_ID.test(url.searchParams.get("source") ?? "");
}

const DISTILLATION_EVIDENCE: SignalPositionEvidenceRef[] = [
  {
    id: "eu-ai-act-gpai-transparency",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    publisher: "EUR-Lex",
    publishedAt: "2024-07-12",
    claimIds: ["provenance-obligations", "model-documentation"],
  },
  {
    id: "c2pa-technical-specification",
    url: "https://c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html",
    publisher: "C2PA",
    publishedAt: "2025-05-01",
    claimIds: ["content-provenance"],
  },
];

const CURRENT_SIGNAL_CANDIDATES: SignalPositionCandidate[] = [
  {
    signalId: "dashboard-focus:2026-02-24:event-4",
    signalVersion: "2026-08-21.1",
    sourcePlaceId: "srt7-ai-labeling-compliance",
    positionRouteId: "content-provenance-engineer",
    impactType: "strengthened",
    potentialScore: 84,
    accessibilityScore: 63,
    horizon: "30d",
    causalClaim: "Споры о distillation усиливают спрос на проверяемое происхождение моделей, данных и производных результатов.",
    whyRecommended: "Есть прямой проверяемый артефакт, открытый стандарт provenance и первое действие без доступа к закрытой модели.",
    counterargument: "Стандарты происхождения контента пока не доказывают происхождение весов модели и могут покрыть лишь часть цепочки.",
    evidenceRefs: DISTILLATION_EVIDENCE,
    confidence: "high",
    updatedAt: "2026-08-21T00:00:00.000Z",
    factors: { impact: 88, urgency: 76, actionability: 82, roleBreadth: 70 },
  },
  {
    signalId: "dashboard-focus:2026-02-24:event-4",
    signalVersion: "2026-08-21.1",
    sourcePlaceId: "srt7-ai-labeling-compliance",
    positionRouteId: "data-access-architect",
    impactType: "strengthened",
    potentialScore: 78,
    accessibilityScore: 72,
    horizon: "now",
    causalClaim: "Ограничения на обучение через API повышают ценность явных условий доступа, отзыва и учёта использования данных.",
    counterargument: "Без договорного доступа к поставщику модели влияние сигнала на конкретный data contract может быть косвенным.",
    evidenceRefs: [DISTILLATION_EVIDENCE[0]],
    confidence: "medium",
    updatedAt: "2026-08-21T00:00:00.000Z",
    factors: { impact: 80, urgency: 82, actionability: 86, roleBreadth: 62 },
  },
  {
    signalId: "dashboard-focus:2026-02-24:event-4",
    signalVersion: "2026-08-21.1",
    sourcePlaceId: "srt7-ai-labeling-compliance",
    positionRouteId: "ai-agent-audit",
    impactType: "verify",
    potentialScore: 70,
    accessibilityScore: 78,
    horizon: "30d",
    causalClaim: "Аудит агента может проверить, какие model API и данные он вызывает, но не происхождение самой модели.",
    counterargument: "Связь с distillation вторична; operational audit не заменяет лицензионный или provenance-аудит.",
    evidenceRefs: [DISTILLATION_EVIDENCE[0]],
    confidence: "medium",
    updatedAt: "2026-08-21T00:00:00.000Z",
    factors: { impact: 58, urgency: 62, actionability: 90, roleBreadth: 66 },
  },
  {
    signalId: "dashboard-focus:2026-02-24:event-4",
    signalVersion: "2026-08-21.1",
    sourcePlaceId: "srt7-ai-labeling-compliance",
    positionRouteId: "ai-content-verification-analyst",
    impactType: "verify",
    potentialScore: 66,
    accessibilityScore: 85,
    horizon: "quarter",
    causalClaim: "Методы верификации результатов могут обнаруживать повторение защищённых материалов, но причинная связь с distillation требует отдельного доказательства.",
    counterargument: "Сходство результата не позволяет надёжно установить способ обучения или нарушение условий API.",
    evidenceRefs: [DISTILLATION_EVIDENCE[1]],
    confidence: "medium",
    updatedAt: "2026-08-21T00:00:00.000Z",
    factors: { impact: 52, urgency: 50, actionability: 78, roleBreadth: 74 },
  },
];

const rankedCurrentSignal = rankSignalPositionCandidates(CURRENT_SIGNAL_CANDIDATES);

export const CURRENT_SIGNAL_POSITION_FIXTURE: SignalPositionFixture = {
  signalId: "dashboard-focus:2026-02-24:event-4",
  signalVersion: "2026-08-21.1",
  sourcePlaceId: "srt7-ai-labeling-compliance",
  title: "Distillation усиливает требования к происхождению AI-результатов",
  causalSummary: "Сигнал затрагивает provenance, условия доступа к данным и проверку производных результатов; operational audit остаётся альтернативой для проверки.",
  relations: rankedCurrentSignal.relations,
};

export const SIGNAL_POSITION_FIXTURES: readonly SignalPositionFixture[] = [CURRENT_SIGNAL_POSITION_FIXTURE];

/** Returns an ID only when that exact dated Dashboard signal is published. */
export function getPublishedDashboardFocusSignalId(
  reportDate: string,
  eventNumber = 4,
  fixtures: readonly SignalPositionFixture[] = SIGNAL_POSITION_FIXTURES,
) {
  const candidateId = `dashboard-focus:${reportDate}:event-${eventNumber}`;
  return fixtures.some((fixture) => fixture.signalId === candidateId) ? candidateId : null;
}

export function resolveSignalPositionRelations(
  signalId: string,
  fixtures: readonly SignalPositionFixture[] = SIGNAL_POSITION_FIXTURES,
  routes: readonly PositionRoute[] = POSITION_ROUTES,
): SignalPositionResolution {
  const fixture = fixtures.find((item) => item.signalId === signalId);
  if (!fixture) return { state: "unknown-signal", fixture: null, relations: [], message: "Неизвестный или устаревший signal ID" };
  const validation = validateSignalPositionRelations(fixture.relations, routes);
  if (!validation.success) return { state: "invalid", fixture, relations: [], errors: validation.errors, message: "Связи сигнала не прошли проверку и не опубликованы" };
  if (fixture.relations.length === 0) return { state: "zero", fixture, relations: [], message: "Пока нельзя доказательно связать сигнал с позициями" };
  if (fixture.relations.length === 1) return { state: "single", fixture, relations: [fixture.relations[0]], message: "Найдена одна подтверждённая позиция. Альтернативы требуют дополнительной проверки." };
  return { state: "full", fixture, relations: fixture.relations };
}
