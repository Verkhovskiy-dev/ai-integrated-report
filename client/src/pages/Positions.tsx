import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Database,
  FileText,
  Gauge,
  Globe2,
  Layers3,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import Footer from "@/components/Footer";
import { useTranslation } from "@/contexts/I18nContext";
import {
  POSITION_ROUTES,
  SRT_PLACES,
  buildBriefText,
  buildEkenPayload,
  buildEkenUrl,
  createPositionRouteId,
  resolvePositionRoute,
  type PositionIntent,
  type PositionRoute,
} from "@/data/positionRoutes";
import {
  resolveRelationPositionRoute,
  resolveSignalPositionRelations,
} from "@/data/signalPositionRelations";

const MAP_POSITIONS: Record<string, { x: number; y: number; shortTitle: string; horizon: string }> = {
  "ai-agent-audit": { x: 77, y: 18, shortTitle: "Аудит AI-агентов", horizon: "2–4 недели" },
  "agentic-migration": { x: 30, y: 29, shortTitle: "Миграция процессов", horizon: "3–6 недель" },
  "vertical-finance-ai": { x: 83, y: 74, shortTitle: "Финансовые агенты", horizon: "1–2 месяца" },
  "agent-memory": { x: 51, y: 56, shortTitle: "Память агентов", horizon: "1–3 месяца" },
  "system-ai-architect": { x: 63, y: 34, shortTitle: "AI-архитектура", horizon: "2–4 недели" },
  "ai-code-auditor": { x: 74, y: 27, shortTitle: "Аудит AI-кода", horizon: "1–3 недели" },
  "ai-qa-designer": { x: 58, y: 48, shortTitle: "AI-QA", horizon: "2–4 недели" },
  "ai-content-verification-analyst": { x: 69, y: 57, shortTitle: "Верификация контента", horizon: "1–3 недели" },
  "data-access-architect": { x: 55, y: 66, shortTitle: "Доступ к данным", horizon: "3–6 недель" },
  "content-provenance-engineer": { x: 76, y: 63, shortTitle: "Provenance контента", horizon: "3–6 недель" },
};

const STATUS_CLASS: Record<string, string> = {
  Открыто: "position-map-status-open",
  Сужается: "position-map-status-narrowing",
};

const FLOW_STEPS = [
  ["Место", "Изменение и окно"],
  ["Карта", "Выбор позиции"],
  ["Позиция", "Рынок, роль и результат"],
  ["Требования", "Арсенал и доступы"],
  ["Самооценка", "Проверка готовности"],
  ["Бриф", "Начало освоения"],
] as const;

const IMPACT_LABELS = { created: "создаётся", strengthened: "усиливается", weakened: "ослабевает", verify: "требует проверки" } as const;
const HORIZON_LABELS = { now: "сейчас", "30d": "30 дней", quarter: "квартал", "12m": "12 месяцев" } as const;

function stepFromUrl() {
  const value = new URLSearchParams(window.location.search).get("step");
  return value === "brief" ? 6 : value === "readiness" ? 5 : value === "position" ? 3 : value === "map" ? 2 : 1;
}

function urlStep(step: number) {
  return step >= 6 ? "brief" : step === 5 ? "readiness" : step >= 3 ? "position" : step === 2 ? "map" : null;
}

function routeResource(route: PositionRoute) {
  if (route.id === "ai-agent-audit") return "Доступ к n8n и логам";
  return route.arsenal.accesses.slice(0, 2).join(" · ");
}

function assessmentItems(route: PositionRoute) {
  return [
    `У меня есть доступ: ${route.arsenal.accesses[0]}`,
    `Я могу работать с платформой: ${route.arsenal.platforms[0]}`,
    `Я владею компетенцией: ${route.arsenal.competencies[0]}`,
    `Я могу выйти на адресата: ${route.recipientRole}`,
    `Я готов выделить ${route.timeToActionMinutes} минут на первое действие`,
  ];
}

export default function Positions() {
  const { locale } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const enteredFromSignal = params.get("from") === "signal" && Boolean(params.get("signal"));
  const requestedPlace = params.get("place") ?? params.get("source") ?? "3";
  const configuredPlace = SRT_PLACES[requestedPlace];
  const place = configuredPlace ?? SRT_PLACES["3"];
  const sourceKey = place.id;
  const cameFromPlaces = params.get("source") === "places" || params.has("place");
  const requestedRouteId = params.get("route");
  const requestedRoute = resolvePositionRoute(requestedPlace, requestedRouteId);
  const sourcePlace = place.label;
  const [step, setStep] = useState(stepFromUrl);
  const [intent, setIntent] = useState<PositionIntent>("expert");
  const placeRoutes = POSITION_ROUTES.filter((route) => route.sourcePlaceIds.includes(sourceKey));
  const initialRouteId = requestedRouteId ?? placeRoutes[0]?.id ?? POSITION_ROUTES[0].id;
  const [routeId, setRouteId] = useState(initialRouteId);
  const [journeyId, setJourneyId] = useState(() => createPositionRouteId());
  const [journeyStartedAt, setJourneyStartedAt] = useState(() => new Date().toISOString());
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  const [copied, setCopied] = useState(false);
  const [marketMethodOpen, setMarketMethodOpen] = useState(false);
  const [relationMethodOpen, setRelationMethodOpen] = useState(false);
  const isEn = locale === "en";
  const impactLabel = (impact: keyof typeof IMPACT_LABELS) => isEn
    ? ({ created: "created", strengthened: "strengthened", weakened: "weakened", verify: "needs verification" } as const)[impact]
    : IMPACT_LABELS[impact];
  const horizonLabel = (horizon: keyof typeof HORIZON_LABELS) => isEn
    ? ({ now: "now", "30d": "30 days", quarter: "quarter", "12m": "12 months" } as const)[horizon]
    : HORIZON_LABELS[horizon];

  const routes = placeRoutes.length ? placeRoutes : POSITION_ROUTES;
  const signalId = params.get("signal") ?? "";
  const relationResolution = enteredFromSignal ? resolveSignalPositionRelations(signalId) : null;
  const relations = relationResolution?.relations ?? [];
  const relationRoutes = relations
    .map((relation) => resolveRelationPositionRoute(relation))
    .filter((route): route is PositionRoute => Boolean(route));
  const routeConfigurationError = params.has("place") && (!configuredPlace || !requestedRoute);
  const selected = relationRoutes.find((route) => route.id === routeId) ?? relationRoutes[0] ?? routes.find((route) => route.id === routeId) ?? routes[0];
  const selectedRelation = relations.find((relation) => relation.positionRouteId === selected.id);
  const checklist = useMemo(() => assessmentItems(selected), [selected]);
  const answeredCount = checklist.filter((item) => answers[item] !== undefined).length;
  const readyCount = checklist.filter((item) => answers[item] === true).length;
  const missing = checklist.filter((item) => answers[item] === false);
  const assessmentComplete = answeredCount === checklist.length;
  const payload = useMemo(
    () => step === 6 ? buildEkenPayload(
      selected,
      intent,
      { sourcePlace, readyCount, total: checklist.length, missing },
      { routeId: journeyId, createdAt: journeyStartedAt, place },
    ) : null,
    [step, selected, intent, sourcePlace, readyCount, checklist.length, missing.join("|"), journeyId, journeyStartedAt, place],
  );
  const brief = `${buildBriefText(selected, intent, place)}\n\nИДЕНТИФИКАТОР МАРШРУТА\nrouteId: ${journeyId}\n\nСАМООЦЕНКА ГОТОВНОСТИ\nИсточник входа: ${sourcePlace}\nПодтверждено: ${readyCount} из ${checklist.length}\nНужно закрыть: ${missing.length ? missing.join("; ") : "ресурсных разрывов не отмечено"}`;
  useEffect(() => {
    document.title = "Маршрут в позицию — Verkhovskiy.ai";
    window.scrollTo(0, 0);
  }, [step]);

  useLayoutEffect(() => {
    document.body.classList.add("positions-page");
    return () => document.body.classList.remove("positions-page");
  }, []);

  useEffect(() => {
    const restoreStep = () => {
      const restored = new URLSearchParams(window.location.search);
      setStep(stepFromUrl());
      const restoredRoute = restored.get("route");
      if (restoredRoute) setRouteId(restoredRoute);
    };
    window.addEventListener("popstate", restoreStep);
    return () => window.removeEventListener("popstate", restoreStep);
  }, []);

  useEffect(() => {
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    if (enteredFromSignal && step === 2) {
      analytics?.track("signal_position_map_opened", {
        signalId,
        signalVersion: relationResolution?.fixture?.signalVersion ?? "unknown",
        sourcePlaceId: place.id,
        positionsShown: relations.length,
        viewMode: new URLSearchParams(window.location.search).get("view") ?? "expert",
        locale,
      });
    } else if (!enteredFromSignal) {
      analytics?.track("position_node_viewed", {
        sourcePlaceId: place.id,
        positionRouteId: selected.id,
        positionsShown: routes.length,
        viewMode: new URLSearchParams(window.location.search).get("view") ?? "expert",
        locale,
      });
    }
  }, [step, place.id, selected.id, journeyId, locale, enteredFromSignal, signalId, relations.length]);

  const chooseRoute = (route: PositionRoute) => {
    setRouteId(route.id);
    setJourneyId(createPositionRouteId());
    setJourneyStartedAt(new Date().toISOString());
    setAnswers({});
    if (!route.intents.includes(intent)) setIntent(route.intents[0]);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("route", route.id);
    window.history.pushState({}, "", nextUrl);
    (window as Window & { umami?: { track: (event: string, data?: Record<string, string | number>) => void } }).umami?.track("position_compared", {
      signalId: signalId || "direct",
      sourcePlaceId: place.id,
      positionRouteId: route.id,
      impactType: relations.find((relation) => relation.positionRouteId === route.id)?.impactType ?? "verify",
      recommended: relations.find((relation) => relation.positionRouteId === route.id)?.recommended ? 1 : 0,
      confidence: relations.find((relation) => relation.positionRouteId === route.id)?.confidence ?? "low",
      positionsShown: relations.length,
    });
  };

  const selectPosition = () => {
    const analytics = (window as Window & { umami?: { track: (event: string, data?: Record<string, string | number>) => void } }).umami;
    if (selectedRelation && !selectedRelation.recommended && relations.some((relation) => relation.recommended)) {
      analytics?.track("position_recommendation_overridden", {
        signalId,
        sourcePlaceId: selectedRelation.sourcePlaceId,
        positionRouteId: selectedRelation.positionRouteId,
        impactType: selectedRelation.impactType,
        confidence: selectedRelation.confidence,
        positionsShown: relations.length,
      });
    }
    analytics?.track("position_selected", {
      signalId: signalId || "direct",
      sourcePlaceId: place.id,
      positionRouteId: selected.id,
      impactType: selectedRelation?.impactType ?? "direct",
      recommended: selectedRelation?.recommended ? 1 : 0,
      confidence: selectedRelation?.confidence ?? "unknown",
      positionsShown: relations.length,
    });
    goTo(3);
  };

  const goTo = (nextStep: number) => {
    const normalized = Math.max(1, Math.min(FLOW_STEPS.length, nextStep));
    const nextUrl = new URL(window.location.href);
    const serialized = urlStep(normalized);
    if (serialized) nextUrl.searchParams.set("step", serialized);
    else nextUrl.searchParams.delete("step");
    window.history.pushState({}, "", nextUrl);
    setStep(normalized);
  };

  const copyBrief = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const startEkenHandoff = () => {
    if (!payload) return;
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    analytics?.track("position_eken_handoff_started", {
      sourcePlaceId: place.id,
      positionRouteId: selected.id,
      journeyId,
    });
    window.open(buildEkenUrl(payload), "_blank", "noopener,noreferrer");
  };

  if (routeConfigurationError) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/60 bg-background/90">
          <div className="container flex h-14 items-center">
            <a href="/places.html" className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> К карте мест
            </a>
          </div>
        </header>
        <main className="container py-16 sm:py-24">
          <section className="position-route-unavailable" aria-labelledby="route-unavailable-title">
            <p>МАРШРУТ НЕДОСТУПЕН</p>
            <h1 id="route-unavailable-title">Для этого места маршрут ещё не настроен</h1>
            <span>Карточка не будет подменена другим сценарием. Вернитесь к карте и выберите место с меткой Eken.</span>
            <a href="/places.html">Вернуться к карте <ArrowRight className="h-4 w-4" /></a>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-4">
          <a href={cameFromPlaces ? "/places.html" : enteredFromSignal ? "/#signal-position-entry" : "/#positions"} className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {cameFromPlaces ? (isEn ? "Back to places" : "К карте мест") : enteredFromSignal ? (isEn ? "Back to signal" : "К сигналу") : (isEn ? "Back to SRT map" : "К карте СРТ")}
          </a>
          <div className="position-source-context"><Target className="h-4 w-4" /><span>{place.label}</span></div>
        </div>
      </header>

      <main className="container py-5 sm:py-7">
        {enteredFromSignal && (
          <section className="position-signal-context" aria-label="Связь сигнала с картой позиций" data-role="signal-context">
            <div>
              <p>{isEn ? "SIGNAL" : "СИГНАЛ"} → {place.label.toUpperCase()}</p>
              <strong>{relationResolution?.fixture?.causalSummary ?? place.change}</strong>
            </div>
            <button type="button" className="position-signal-method" onClick={() => setRelationMethodOpen((current) => !current)} aria-expanded={relationMethodOpen}>
              {isEn ? "Why this link?" : "Почему так?"} <ChevronDown className="h-4 w-4" />
            </button>
            {relationMethodOpen && (
              <div className="position-signal-evidence" role="note">
                <span><b>Evidence:</b> {relations.flatMap((relation) => relation.evidenceRefs).filter((evidence, index, all) => all.findIndex((item) => item.url === evidence.url) === index).map((evidence, index) => <span key={evidence.url}>{index > 0 && " · "}<a href={evidence.url} target="_blank" rel="noopener noreferrer">{evidence.publisher}</a></span>)}</span>
                <span><b>Assumption:</b> {isEn ? "The causal link is checked per position and includes a counterargument." : "причинная связь проверяется отдельно для каждой позиции и содержит контраргумент."}</span>
                <span><b>{isEn ? "Method" : "Метод"}:</b> relevance = 30% impact + 25% evidence + 20% urgency + 15% actionability + 10% role breadth.</span>
              </div>
            )}
          </section>
        )}
        <div className="position-flow-title"><div><p>{isEn ? "SRT ENTRY" : "ВХОД ИЗ СРТ"} · {sourcePlace}</p><h1>{isEn ? "Position map" : "Карта позиций"}</h1></div></div>

        <nav className="position-compact-progress" aria-label="Этапы выбора позиции">
          {(isEn ? ["Map", "Position", "Readiness", "Brief"] : ["Карта", "Позиция", "Готовность", "Бриф"]).map((label, index) => {
            const activeIndex = step <= 2 ? 0 : step <= 4 ? 1 : step === 5 ? 2 : 3;
            return <span key={label} aria-current={index === activeIndex ? "step" : undefined} className={index === activeIndex ? "is-active" : index < activeIndex ? "is-complete" : ""}>{label}</span>;
          })}
        </nav>

        {step === 1 && (
          <div className="position-place-layout">
            <section className="position-place-main" aria-labelledby="place-title">
              <div className="position-place-signal"><RadioTower /><span>ПИЛОТНОЕ МЕСТО · ОКНО {place.window.toUpperCase()}</span></div>
              <p className="position-stage-kicker">ШАГ 1 · КАРТОЧКА МЕСТА</p>
              <h2 id="place-title">{place.name}</h2>
              <p className="position-place-change">{place.change}</p>
              <div className="position-place-evidence">
                <article><Layers3 /><span>Что изменилось</span><strong>Агенты получили доступ к исполнению, а не только к генерации ответа.</strong></article>
                <article><Clock3 /><span>Почему сейчас</span><strong>{place.whyNow}</strong></article>
                <article><CheckCircle2 /><span>Продуктивный выход</span><strong>{place.productiveExit}</strong></article>
              </div>
            </section>
            <aside className="position-place-aside">
              <p>ДОСТУПНО ИЗ МЕСТА</p>
              <h3>{routes.length} {routes.length === 1 ? "позиция" : routes.length < 5 ? "позиции" : "позиций"}</h3>
              <span>Пилот проверяет полный путь от изменения в СРТ до результата, принятого внешним адресатом.</span>
              <div className="position-place-proof">
                <small>Условия входа</small>
                {place.evidence.map((item) => <strong key={item}><Check className="h-4 w-4" />{item}</strong>)}
              </div>
              <button type="button" className="position-map-primary" onClick={() => goTo(2)} data-umami-event="srt-place-open">Посмотреть позиции <ArrowRight /></button>
              <p className="position-map-next">Далее: карта доступных манёвров из этого места</p>
            </aside>
          </div>
        )}

        {step === 2 && (
          !enteredFromSignal ? (
            <div className="position-general-layout" data-role="general-position-map">
              <section className="position-general-list" aria-labelledby="general-map-title">
                <p className="position-stage-kicker">ДОСТУПНЫЕ ПОЗИЦИИ</p>
              <h2 id="general-map-title">{isEn ? "Choose a position to compare" : "Выберите позицию для сравнения"}</h2>
                {routes.map((route, index) => (
                  <button key={route.id} type="button" className={selected.id === route.id ? "is-selected" : ""} onClick={() => chooseRoute(route)} aria-pressed={selected.id === route.id}>
                    <span>#{index + 1}</span><strong>{route.position}</strong><small>{route.window}</small>
                  </button>
                ))}
              </section>
              <aside className="position-map-detail" aria-live="polite">
                <div className="position-map-detail-kicker"><span>{isEn ? "SELECTED POSITION" : "ВЫБРАННАЯ ПОЗИЦИЯ"}</span><span>SRT-{selected.level}</span></div>
                <h2>{selected.position}</h2>
                <p>{selected.mission}</p>
                <div className="position-map-detail-section"><h3>{isEn ? "First action" : "Первое действие"}</h3><p>{selected.firstAction}</p><p className="position-card-meta">{isEn ? "Artifact" : "Артефакт"}: {selected.output}</p></div>
                <div className="position-map-detail-section position-map-risk"><ShieldAlert className="h-6 w-6" /><div><h3>Риск входа</h3><strong>{selected.resourceGap.title}</strong><p>{selected.resourceGap.description}</p></div></div>
                <button type="button" className="position-map-primary" onClick={selectPosition}>{isEn ? "Select position" : "Выбрать позицию"} <ArrowRight className="h-4 w-4" /></button>
              </aside>
            </div>
          ) : relations.length === 0 ? (
            <section className="position-relation-empty" data-role={relationResolution?.state === "unknown-signal" ? "unknown-signal-state" : relationResolution?.state === "invalid" ? "invalid-relations-state" : "zero-relations-state"}>
              <AlertTriangle className="h-7 w-7" />
              <h2>{relationResolution && relationResolution.state !== "full" ? relationResolution.message : "Пока нельзя доказательно связать сигнал с позициями"}</h2>
              <p>{relationResolution?.state === "invalid" ? (isEn ? "Relations were not published because they failed data validation." : "Связи не опубликованы, потому что не прошли проверку данных.") : (isEn ? "We do not replace an unknown or stale signal with a generic route. Return to the dashboard and choose another signal." : "Мы не подменяем неизвестный или устаревший сигнал общим маршрутом. Вернитесь к сводке и выберите другой сигнал.")}</p>
              <a href="/#signal-position-entry">{isEn ? "Back to signals" : "Вернуться к сигналам"}</a>
            </section>
          ) : relations.length === 1 ? (
            <section className="position-single-relation" data-role="single-relation-state">
              <p className="position-stage-kicker">ОДНА ПОДТВЕРЖДАЕМАЯ СВЯЗЬ</p>
              <h2>{relationRoutes[0]?.position}</h2>
              <p>{relationResolution?.state === "single" ? relationResolution.message : "Найдена одна позиция. Альтернативы требуют дополнительной проверки."}</p>
              <div className="position-relation-badges"><span>{impactLabel(relations[0].impactType)}</span><span>{horizonLabel(relations[0].horizon)}</span></div>
              <p className="position-relation-claim">{relations[0].causalClaim}</p>
              <button type="button" className="position-map-primary" onClick={selectPosition}>{isEn ? "Open position" : "Открыть позицию"} <ArrowRight className="h-4 w-4" /></button>
            </section>
          ) : (
            <div className="position-map-layout" data-role="signal-position-relations" data-relation-count={relations.length}>
              <section className="position-map-field" aria-labelledby="position-map-title">
                <div className="position-map-heading">
                  <div><p>{isEn ? "POSITION COMPARISON" : "СРАВНЕНИЕ ПОЗИЦИЙ"}</p><h2 id="position-map-title">{isEn ? "Where can this signal change the work?" : "Где сигнал может изменить работу?"}</h2></div>
                  <p className="position-map-fit-note">{isEn ? "Ranking reflects validated relation evidence" : "Ранжирование основано на проверенных relation evidence"}</p>
                </div>
                <div className="position-map-canvas">
                  <span className="position-axis-y-title">{isEn ? "Useful-result potential" : "Потенциал полезного результата"}</span><span className="position-axis-y-top">{isEn ? "HIGH" : "ВЫШЕ"}</span><span className="position-axis-y-bottom">{isEn ? "LOW" : "НИЖЕ"}</span>
                  <span className="position-axis-x-title">{isEn ? "Accessibility now" : "Доступность входа сейчас"}</span><span className="position-axis-x-left">{isEn ? "LOW" : "НИЖЕ"}</span><span className="position-axis-x-right">{isEn ? "HIGH" : "ВЫШЕ"}</span>
                  <div className="position-map-grid" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}><CartesianGrid stroke="rgba(125, 143, 156, 0.16)" strokeDasharray="4 4" /><XAxis type="number" dataKey="x" domain={[0, 100]} hide /><YAxis type="number" dataKey="y" domain={[0, 100]} hide /><Scatter data={[]} /></ScatterChart></ResponsiveContainer></div>
                  {relations.map((relation, rank) => {
                    const route = resolveRelationPositionRoute(relation)!;
                    const coords = MAP_POSITIONS[route.id];
                    const active = selected.id === route.id;
                    return <button key={route.id} type="button" data-role="position-relation" data-impact-type={relation.impactType} className={`position-map-node ${active ? "is-selected" : ""} ${relation.recommended ? "is-recommended" : ""}`} style={{ left: `${relation.accessibilityScore}%`, top: `${100 - relation.potentialScore}%` }} onClick={() => chooseRoute(route)} aria-pressed={active} aria-label={`${rank + 1}. ${route.position}, ${impactLabel(relation.impactType)}, ${isEn ? "accessibility" : "доступность"} ${relation.accessibilityScore}, ${isEn ? "potential" : "потенциал"} ${relation.potentialScore}, ${horizonLabel(relation.horizon)}`}><span className="position-map-node-dot" /><span className="position-map-node-copy"><small>#{rank + 1} · {relation.recommended ? (isEn ? "RECOMMENDED" : "РЕКОМЕНДУЕМАЯ") : impactLabel(relation.impactType).toUpperCase()}</small><strong>{coords?.shortTitle ?? route.position}</strong><em className={STATUS_CLASS[route.window] ?? "position-map-status-open"}>{route.window}</em></span></button>;
                  })}
                </div>
                <div className="position-map-legend"><span><i className="position-map-status-open" /> {isEn ? "Window open" : "Окно открыто"}</span><span><i className="position-map-status-narrowing" /> {isEn ? "Window narrowing" : "Окно сужается"}</span><span className="position-map-caption">{isEn ? "On mobile, the map becomes a ranked list with the same data." : "На mobile карта заменяется ранжированным списком с теми же данными."}</span></div>
              </section>
              <aside className="position-map-detail" aria-live="polite" data-role="position-relation-detail">
                <div className="position-map-detail-kicker"><span>{selectedRelation?.recommended ? (isEn ? "RECOMMENDED POSITION" : "РЕКОМЕНДУЕМАЯ ПОЗИЦИЯ") : (isEn ? "ALTERNATIVE" : "АЛЬТЕРНАТИВА")}</span><span>SRT-{selected.level}</span></div>
                <h2>{selected.position}</h2>
                <div className="position-map-detail-status"><span>{isEn ? "Impact" : "Влияние"}: {selectedRelation ? impactLabel(selectedRelation.impactType) : "—"}</span><span>{selectedRelation ? horizonLabel(selectedRelation.horizon) : "—"}</span></div>
                <div className="position-map-detail-section"><h3>{selectedRelation?.recommended ? (isEn ? "Why recommended" : "Почему рекомендована") : (isEn ? "Why consider it" : "Почему рассматриваем")}</h3><p>{selectedRelation?.whyRecommended ?? selectedRelation?.causalClaim}</p><p className="position-card-meta">{isEn ? "Counterargument" : "Контраргумент"}: {selectedRelation?.counterargument}</p></div>
                <div className="position-score-grid"><div><span>{isEn ? "Potential" : "Потенциал"}</span><strong>{selectedRelation?.potentialScore ?? "—"}{selectedRelation && "/100"}</strong></div><div><span>{isEn ? "Accessibility" : "Доступность"}</span><strong>{selectedRelation?.accessibilityScore ?? "—"}{selectedRelation && "/100"}</strong></div><div><span>{isEn ? "Relevance" : "Релевантность"}</span><strong>{selectedRelation?.relevanceScore ?? "—"}{selectedRelation && "/100"}</strong></div></div>
                <details className="position-score-method"><summary>{isEn ? "How scores are calculated" : "Как получены оценки"}</summary><p>{isEn ? "Potential and accessibility come from the relation API. A recommendation requires relevance ≥60, confidence of medium or higher, a measurable action and an outcome criterion." : "Потенциал и доступность публикуются relation API. Рекомендация возможна только при relevance ≥60, confidence не ниже medium, измеримом действии и критерии результата."}</p></details>
                <div className="position-map-detail-section"><div className="position-map-fit-label"><h3>{isEn ? "First action" : "Первое действие"}</h3><strong>{selected.timeToActionMinutes} {isEn ? "min" : "мин"}</strong></div><p>{selected.firstAction}</p><p className="position-card-meta">{isEn ? "Artifact" : "Артефакт"}: {selected.output}</p></div>
                <div className="position-map-detail-section position-map-resource"><Database className="h-6 w-6" /><div><h3>{isEn ? "Key resource" : "Ключевой ресурс"}</h3><strong>{routeResource(selected)}</strong><p>{selected.resourceGap.description}</p></div></div>
                <div className="position-map-detail-section position-map-risk"><ShieldAlert className="h-6 w-6" /><div><h3>{isEn ? "Main risk" : "Основной риск"}</h3><strong>{selectedRelation?.counterargument}</strong><p>{isEn ? "Choosing an alternative over the recommendation is a normal comparison outcome." : "Выбор альтернативы вместо рекомендации — нормальный сценарий сравнения."}</p></div></div>
                <button type="button" className="position-map-primary" onClick={selectPosition}>{isEn ? "Select position" : "Выбрать позицию"} <ArrowRight className="h-4 w-4" /></button>
              </aside>
            </div>
          )
        )}

        {step === 3 && (
          <div className="position-stage-layout">
            <section className="position-stage-main">
              <p className="position-stage-kicker">ШАГ 3 · КОНТРАКТ ПОЗИЦИИ</p>
              <h2>{selected.position}</h2>
              <p className="position-stage-lead">{selected.mission}</p>
              <div className="position-contract-grid">
                <article><Target /><span>Объект</span><strong>{selected.object}</strong></article>
                <article><Users /><span>Адресат</span><strong>{selected.recipientRole}</strong></article>
                <article><FileText /><span>Продуктивный выход</span><strong>{selected.output}</strong></article>
                <article><CheckCircle2 /><span>Критерий приёмки</span><strong>{selected.acceptanceCriterion}</strong></article>
              </div>
              {selected.marketAnalysis && (
                <section className="position-market" aria-labelledby="position-market-title">
                  <div className="position-market-heading">
                    <div><p>АНАЛИТИКА ПОЗИЦИИ</p><h2 id="position-market-title">Кому нужна эта позиция</h2></div>
                    <span>Уверенность: {selected.marketAnalysis.confidence} · {selected.marketAnalysis.updatedAt}</span>
                  </div>
                  <p className="position-market-signal">{selected.marketAnalysis.demandSignal}</p>
                  <div className="position-market-buyers">
                    {selected.marketAnalysis.buyers.map((buyer) => (
                      <article key={buyer.title}><Building2 /><div><strong>{buyer.title}</strong><span>{buyer.need}</span></div></article>
                    ))}
                  </div>
                  <div className="position-market-columns">
                    <div>
                      <h3><Globe2 /> Где востребована</h3>
                      {selected.marketAnalysis.geographies.map((item) => <article key={item.market}><strong>{item.market}</strong><span>{item.demand}</span></article>)}
                    </div>
                    <div>
                      <h3><BriefcaseBusiness /> Форматы работы</h3>
                      {selected.marketAnalysis.workModels.map((model) => <span className="position-market-model" key={model}>{model}</span>)}
                    </div>
                  </div>
                  <div className="position-market-evidence">
                    <div>
                      <strong>Основание оценки</strong>
                      <span>Спрос подтверждён отраслевыми обзорами и вакансиями работодателей.</span>
                      <small>Уверенность: {selected.marketAnalysis.confidence} · обновлено {selected.marketAnalysis.updatedAt}</small>
                    </div>
                    <button
                      type="button"
                      className="position-market-method-toggle"
                      aria-expanded={marketMethodOpen}
                      aria-controls="position-market-method"
                      onClick={() => setMarketMethodOpen((open) => !open)}
                    >
                      {marketMethodOpen ? "Скрыть источники и методику" : "Посмотреть источники и методику"}
                    </button>
                    {marketMethodOpen && (
                      <div id="position-market-method" className="position-market-method">
                        <p>Сопоставлены обзоры рынка AI governance, требования работодателей и ориентиры оплаты для близких ролей. Диапазоны показывают рынок, а не персональный прогноз дохода.</p>
                        <div className="position-market-source-links">
                          {selected.marketAnalysis.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </section>
            <aside className="position-stage-aside">
              {selected.marketAnalysis && <div className="position-pay-card"><Banknote /><p>ОРИЕНТИР ОПЛАТЫ</p><h3>{selected.marketAnalysis.compensation[0].range}</h3><span>{selected.marketAnalysis.compensation[0].market} · {selected.marketAnalysis.compensation[0].role}</span><div className="position-pay-list">{selected.marketAnalysis.compensation.slice(1).map((item) => <div key={`${item.market}-${item.role}`}><span>{item.market}<small>{item.role}</small></span><strong>{item.range}</strong></div>)}</div><small>Base salary до налогов. Для новой позиции диапазон оценочный: использованы роли AI governance и AI auditor.</small></div>}
              <div className="position-goal-card"><p>ЦЕЛЬ МАРШРУТА</p><h3>{selected.result}</h3><div className="position-time"><Clock3 /><span><small>До первого действия</small><strong>≤ {selected.timeToActionMinutes} мин</strong></span></div><button className="position-map-primary" onClick={() => goTo(4)}>Посмотреть требования <ArrowRight /></button></div>
            </aside>
          </div>
        )}

        {step === 4 && (
          <div className="position-stage-layout position-requirements-layout">
            <section className="position-stage-main">
              <p className="position-stage-kicker">ШАГ 4 · ТРЕБОВАНИЯ К ПОЗИЦИИ</p><h2>Арсенал первого действия</h2><p className="position-stage-lead">Только то, что необходимо для выполнения и принятия первого результата.</p>
              <div className="position-requirements">
                <article><Wrench /><span><small>Платформы</small><strong>{selected.arsenal.platforms.join(" · ")}</strong></span></article>
                <article><Gauge /><span><small>Компетенции</small><strong>{selected.arsenal.competencies.join(" · ")}</strong></span></article>
                <article><Users /><span><small>Площадки коммуникации</small><strong>{selected.arsenal.communicationVenues.join(" · ")}</strong></span></article>
                <article><Database /><span><small>Доступы</small><strong>{selected.arsenal.accesses.join(" · ")}</strong></span></article>
                <article><ShieldCheck /><span><small>Нормативная опора</small><strong>{selected.arsenal.norms.join(" · ")}</strong></span></article>
              </div>
            </section>
            <aside className="position-stage-aside position-gap-card"><p>РЕСУРСНЫЙ РАЗРЫВ</p><h3>{selected.resourceGap.title}</h3><span>{selected.resourceGap.description}</span><div className="position-time"><Clock3 /><span><small>На закрытие разрыва</small><strong>{selected.resourceGap.estimatedMinutes} мин</strong></span></div><small>Результат подготовки</small><b>{selected.resourceGap.artifact}</b><button className="position-map-primary" onClick={() => goTo(5)}>Оценить готовность <ArrowRight /></button></aside>
          </div>
        )}

        {step === 5 && (
          <div className="position-stage-layout">
            <section className="position-stage-main">
              <p className="position-stage-kicker">ШАГ 5 · САМООЦЕНКА</p><h2>Что у вас уже есть?</h2><p className="position-stage-lead">Ответьте по каждому требованию. Недостающее автоматически попадёт в бриф освоения.</p>
              <div className="position-assessment-list">
                {checklist.map((item, index) => <div key={item} className={answers[item] === true ? "is-ready" : answers[item] === false ? "is-missing" : ""}><span className="position-assessment-number">{index + 1}</span><strong>{item}</strong><div><button type="button" aria-pressed={answers[item] === true} onClick={() => setAnswers((current) => ({ ...current, [item]: true }))}>Есть</button><button type="button" aria-pressed={answers[item] === false} onClick={() => setAnswers((current) => ({ ...current, [item]: false }))}>Нет</button></div></div>)}
              </div>
            </section>
            <aside className="position-stage-aside position-readiness-card"><p>ГОТОВНОСТЬ</p><h3>{Math.round((readyCount / checklist.length) * 100)}%</h3><span>Подтверждено {readyCount} из {checklist.length} требований</span><div className="position-map-fit-track"><span style={{ width: `${(readyCount / checklist.length) * 100}%` }} /></div><small>{assessmentComplete ? (missing.length ? `В маршрут войдут ${missing.length} ресурсных разрыва` : "Можно начинать первое действие") : `Осталось оценить: ${checklist.length - answeredCount}`}</small><button className="position-map-primary" disabled={!assessmentComplete} onClick={() => goTo(6)} data-umami-event="position-brief-created">Сформировать бриф <ArrowRight /></button></aside>
          </div>
        )}

        {step === 6 && (
          <div className="position-stage-layout position-brief-layout">
            <section className="position-stage-main"><p className="position-stage-kicker">ШАГ 6 · ГОТОВЫЙ БРИФ</p><h2>Маршрут освоения позиции собран</h2><p className="position-stage-lead">Eken получит контекст места СРТ, контракт позиции, требования, результат самооценки и первое продуктивное действие.</p><div className="position-route-ledger"><span>Место <strong>{place.id}</strong></span><ArrowRight /><span>Позиция <strong>{selected.id}</strong></span><ArrowRight /><span>Маршрут <strong>{journeyId.slice(0, 8)}</strong></span></div><pre className="position-brief-preview">{brief}</pre></section>
            <aside className="position-stage-aside position-launch-card"><BookOpen /><p>ПЕРЕДАЧА В EKEN</p><h3>{selected.position}</h3><span>{missing.length ? `Закрыть ${missing.length} разрыва и перейти к первому действию` : "Закрепить маршрут и перейти к первому действию"}</span><div className="position-time"><Clock3 /><span><small>Первое действие</small><strong>≤ {selected.timeToActionMinutes} мин</strong></span></div><button type="button" onClick={startEkenHandoff} disabled={!payload} data-umami-event="position-eken-handoff" className="position-map-primary">Передать бриф и начать <ArrowRight /></button><button type="button" onClick={copyBrief} className="position-copy-brief" data-umami-event="position-brief-copied">{copied ? <Check /> : <Copy />}{copied ? "Бриф скопирован" : "Копировать бриф"}</button></aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
