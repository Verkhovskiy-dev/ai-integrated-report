import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  FileText,
  Gauge,
  Globe2,
  Layers3,
  RadioTower,
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

const MAP_POSITIONS: Record<string, { x: number; y: number; shortTitle: string; horizon: string }> = {
  "ai-agent-audit": { x: 77, y: 18, shortTitle: "Аудит AI-агентов", horizon: "2–4 недели" },
  "agentic-migration": { x: 30, y: 29, shortTitle: "Миграция процессов", horizon: "3–6 недель" },
  "vertical-finance-ai": { x: 83, y: 74, shortTitle: "Финансовые агенты", horizon: "1–2 месяца" },
  "agent-memory": { x: 51, y: 56, shortTitle: "Память агентов", horizon: "1–3 месяца" },
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
  const params = new URLSearchParams(window.location.search);
  const requestedPlace = params.get("place") ?? params.get("source") ?? "3";
  const configuredPlace = SRT_PLACES[requestedPlace];
  const place = configuredPlace ?? SRT_PLACES["3"];
  const sourceKey = place.id;
  const cameFromPlaces = params.get("source") === "places" || params.has("place");
  const requestedRouteId = params.get("route");
  const requestedRoute = resolvePositionRoute(requestedPlace, requestedRouteId);
  const sourcePlace = place.label;
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<PositionIntent>("expert");
  const placeRoutes = POSITION_ROUTES.filter((route) => route.sourcePlaceIds.includes(sourceKey));
  const initialRouteId = placeRoutes.some((route) => route.id === requestedRouteId)
    ? requestedRouteId!
    : placeRoutes[0]?.id ?? POSITION_ROUTES[0].id;
  const [routeId, setRouteId] = useState(initialRouteId);
  const [journeyId, setJourneyId] = useState(() => createPositionRouteId());
  const [journeyStartedAt, setJourneyStartedAt] = useState(() => new Date().toISOString());
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  const [copied, setCopied] = useState(false);
  const [marketMethodOpen, setMarketMethodOpen] = useState(false);

  const routes = placeRoutes.length ? placeRoutes : POSITION_ROUTES;
  const routeConfigurationError = params.has("place") && (!configuredPlace || !requestedRoute);
  const selected = routes.find((route) => route.id === routeId) ?? routes[0];
  const selectedMap = MAP_POSITIONS[selected.id];
  const checklist = useMemo(() => assessmentItems(selected), [selected]);
  const answeredCount = checklist.filter((item) => answers[item] !== undefined).length;
  const readyCount = checklist.filter((item) => answers[item] === true).length;
  const missing = checklist.filter((item) => answers[item] === false);
  const assessmentComplete = answeredCount === checklist.length;
  const payload = useMemo(
    () => buildEkenPayload(
      selected,
      intent,
      { sourcePlace, readyCount, total: checklist.length, missing },
      { routeId: journeyId, createdAt: journeyStartedAt, place },
    ),
    [selected, intent, sourcePlace, readyCount, checklist.length, missing.join("|"), journeyId, journeyStartedAt, place],
  );
  const brief = `${buildBriefText(selected, intent, place)}\n\nИДЕНТИФИКАТОР МАРШРУТА\nrouteId: ${journeyId}\n\nСАМООЦЕНКА ГОТОВНОСТИ\nИсточник входа: ${sourcePlace}\nПодтверждено: ${readyCount} из ${checklist.length}\nНужно закрыть: ${missing.length ? missing.join("; ") : "ресурсных разрывов не отмечено"}`;
  const ekenUrl = buildEkenUrl(payload);

  useEffect(() => {
    document.title = "Маршрут в позицию — Verkhovskiy.ai";
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    analytics?.track("position-step-view", {
      place: place.id,
      position: selected.id,
      step,
      journey: journeyId,
    });
  }, [step, place.id, selected.id, journeyId]);

  const chooseRoute = (route: PositionRoute) => {
    setRouteId(route.id);
    setJourneyId(createPositionRouteId());
    setJourneyStartedAt(new Date().toISOString());
    setAnswers({});
    if (!route.intents.includes(intent)) setIntent(route.intents[0]);
  };

  const goTo = (nextStep: number) => {
    setStep(Math.max(1, Math.min(FLOW_STEPS.length, nextStep)));
  };

  const copyBrief = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
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
          <a href={cameFromPlaces ? "/places.html" : "/#positions"} className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {cameFromPlaces ? "К карте мест" : "К карте СРТ"}
          </a>
          <div className="position-source-context"><Target className="h-4 w-4" /><span>{place.label}</span></div>
        </div>
      </header>

      <main className="container py-5 sm:py-7">
        <div className="position-flow-title">
          <div>
            <p>ВХОД ИЗ СРТ · {sourcePlace}</p>
            <h1>{FLOW_STEPS[step - 1][0]}</h1>
          </div>
          {step > 1 && <button type="button" onClick={() => goTo(step - 1)}><ArrowLeft className="h-4 w-4" /> Назад</button>}
        </div>

        <nav className="position-route-steps position-route-steps-six" aria-label="Этапы входа в позицию">
          {FLOW_STEPS.map(([label, description], index) => {
            const number = index + 1;
            const available = number <= step;
            return (
              <button key={label} type="button" disabled={!available} onClick={() => available && goTo(number)} className={`position-route-step ${number === step ? "is-active" : ""} ${number < step ? "is-complete" : ""}`}>
                <span className="position-route-step-number">{number < step ? <Check className="h-4 w-4" /> : number}</span>
                <span><strong>{label}</strong><small>{description}</small></span>
              </button>
            );
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
              <button type="button" className="position-map-primary" onClick={() => goTo(2)} data-umami-event="srt-place-open" data-umami-event-place={place.id}>Посмотреть позиции <ArrowRight /></button>
              <p className="position-map-next">Далее: карта доступных манёвров из этого места</p>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="position-map-layout">
            <section className="position-map-field" aria-labelledby="position-map-title">
              <div className="position-map-heading">
                <div><p>ШАГ 2 · КАРТА ПОЗИЦИЙ</p><h2 id="position-map-title">Где действовать из выбранного места?</h2></div>
                <p className="position-map-fit-note">Выше и правее — выше потенциал и проще вход</p>
              </div>
              <div className="position-map-canvas">
                <span className="position-axis-y-title">Потенциал позиции</span><span className="position-axis-y-top">ВЫШЕ</span><span className="position-axis-y-bottom">НИЖЕ</span>
                <span className="position-axis-x-title">Доступность сейчас</span><span className="position-axis-x-left">НИЖЕ</span><span className="position-axis-x-right">ВЫШЕ</span>
                <div className="position-map-grid" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}><CartesianGrid stroke="rgba(125, 143, 156, 0.16)" strokeDasharray="4 4" /><XAxis type="number" dataKey="x" domain={[0, 100]} hide /><YAxis type="number" dataKey="y" domain={[0, 100]} hide /><Scatter data={[]} /></ScatterChart></ResponsiveContainer></div>
                {routes.map((route) => {
                  const coords = MAP_POSITIONS[route.id];
                  const active = selected.id === route.id;
                  return <button key={route.id} type="button" className={`position-map-node ${active ? "is-selected" : ""}`} style={{ left: `${coords.x}%`, top: `${coords.y}%` }} onClick={() => chooseRoute(route)} aria-pressed={active} aria-label={`${coords.shortTitle}, соответствие ${route.resourceMatchPercent}%, окно ${route.window.toLowerCase()}`}><span className="position-map-node-dot" /><span className="position-map-node-copy"><small>СРТ-{route.level}</small><strong>{coords.shortTitle}</strong><em className={STATUS_CLASS[route.window] ?? "position-map-status-open"}>{route.window}</em></span></button>;
                })}
              </div>
              <div className="position-map-legend" aria-label="Легенда карты"><span><i className="position-map-status-open" /> Окно открыто</span><span><i className="position-map-status-narrowing" /> Окно сужается</span><span className="position-map-caption">Карта показывает позиции, доступные из узла «{sourcePlace}».</span></div>
            </section>
            <aside className="position-map-detail" aria-live="polite">
              <div className="position-map-detail-kicker"><span>ВЫБРАННАЯ ПОЗИЦИЯ</span><span>СРТ-{selected.level}</span></div>
              <h2>{selected.position}</h2>
              <div className="position-map-detail-status"><span className={STATUS_CLASS[selected.window] ?? "position-map-status-open"}>{selected.window}</span><span>Горизонт: {selectedMap.horizon}</span></div>
              <div className="position-map-detail-section"><h3>{selected.title}</h3><p>{selected.description}</p></div>
              <div className="position-map-detail-section"><div className="position-map-fit-label"><h3>Соответствие</h3><strong>{selected.resourceMatchPercent}%</strong></div><div className="position-map-fit-track"><span style={{ width: `${selected.resourceMatchPercent}%` }} /></div><p>{selected.whyNow}</p></div>
              <div className="position-map-detail-section position-map-resource"><Database className="h-6 w-6" /><div><h3>Ключевой ресурс</h3><strong>{routeResource(selected)}</strong><p>{selected.resourceGap.description}</p></div></div>
              <button type="button" className="position-map-primary" onClick={() => goTo(3)} data-umami-event="srt-position-selected" data-umami-event-place={place.id} data-umami-event-position={selected.id}>Выбрать позицию <ArrowRight className="h-4 w-4" /></button>
              <p className="position-map-next">Далее: описание роли и продуктивного результата</p>
            </aside>
          </div>
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
            <aside className="position-stage-aside position-readiness-card"><p>ГОТОВНОСТЬ</p><h3>{Math.round((readyCount / checklist.length) * 100)}%</h3><span>Подтверждено {readyCount} из {checklist.length} требований</span><div className="position-map-fit-track"><span style={{ width: `${(readyCount / checklist.length) * 100}%` }} /></div><small>{assessmentComplete ? (missing.length ? `В маршрут войдут ${missing.length} ресурсных разрыва` : "Можно начинать первое действие") : `Осталось оценить: ${checklist.length - answeredCount}`}</small><button className="position-map-primary" disabled={!assessmentComplete} onClick={() => goTo(6)} data-umami-event="position-brief-created" data-umami-event-place={place.id} data-umami-event-position={selected.id} data-umami-event-ready={readyCount} data-umami-event-total={checklist.length}>Сформировать бриф <ArrowRight /></button></aside>
          </div>
        )}

        {step === 6 && (
          <div className="position-stage-layout position-brief-layout">
            <section className="position-stage-main"><p className="position-stage-kicker">ШАГ 6 · ГОТОВЫЙ БРИФ</p><h2>Маршрут освоения позиции собран</h2><p className="position-stage-lead">Eken получит контекст места СРТ, контракт позиции, требования, результат самооценки и первое продуктивное действие.</p><div className="position-route-ledger"><span>Место <strong>{place.id}</strong></span><ArrowRight /><span>Позиция <strong>{selected.id}</strong></span><ArrowRight /><span>Маршрут <strong>{journeyId.slice(0, 8)}</strong></span></div><pre className="position-brief-preview">{brief}</pre></section>
            <aside className="position-stage-aside position-launch-card"><BookOpen /><p>ПЕРЕДАЧА В EKEN</p><h3>{selected.position}</h3><span>{missing.length ? `Закрыть ${missing.length} разрыва и перейти к первому действию` : "Закрепить маршрут и перейти к первому действию"}</span><div className="position-time"><Clock3 /><span><small>Первое действие</small><strong>≤ {selected.timeToActionMinutes} мин</strong></span></div><a href={ekenUrl} target="_blank" rel="noreferrer" data-umami-event="position-eken-handoff" data-umami-event-place={place.id} data-umami-event-position={selected.id} data-umami-event-route={journeyId} className="position-map-primary">Начать освоение позиции <ArrowRight /></a><button type="button" onClick={copyBrief} className="position-copy-brief" data-umami-event="position-brief-copied" data-umami-event-place={place.id} data-umami-event-position={selected.id}>{copied ? <Check /> : <Copy />}{copied ? "Бриф скопирован" : "Копировать бриф"}</button></aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
