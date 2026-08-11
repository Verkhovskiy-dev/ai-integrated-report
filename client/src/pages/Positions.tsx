import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Map,
  Target,
  X,
} from "lucide-react";
import Footer from "@/components/Footer";
import {
  POSITION_ROUTES,
  buildBriefText,
  buildEkenPayload,
  buildEkenUrl,
  type PositionIntent,
} from "@/data/positionRoutes";

const INTENTS: Array<{ id: PositionIntent; label: string }> = [
  { id: "expert", label: "Применить компетенцию" },
  { id: "business", label: "Запустить продукт" },
  { id: "invest", label: "Найти инвестицию" },
];

export default function Positions() {
  const [intent, setIntent] = useState<PositionIntent>("expert");
  const [routeId, setRouteId] = useState(POSITION_ROUTES[0].id);
  const [briefOpen, setBriefOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const routes = useMemo(
    () => POSITION_ROUTES.filter((route) => route.intents.includes(intent)),
    [intent],
  );
  const selected = routes.find((route) => route.id === routeId) ?? routes[0];
  const payload = useMemo(() => buildEkenPayload(selected, intent), [selected, intent]);
  const brief = buildBriefText(selected, intent);
  const ekenUrl = buildEkenUrl(payload);

  useEffect(() => {
    document.title = "Карта мест — Verkhovskiy.ai";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!routes.some((route) => route.id === routeId)) setRouteId(routes[0].id);
  }, [routeId, routes]);

  const copyBrief = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-4">
          <a href="/#positions" className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            К дашборду
          </a>
          <div className="flex items-center gap-2 text-xs font-mono text-primary">
            <Target className="h-4 w-4" />
            ВХОД В ПОЗИЦИЮ
          </div>
        </div>
      </header>

      <main className="container py-8 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-mono tracking-[0.18em] text-primary">КАРТА МЕСТ · СРТ</p>
          <h1 className="mb-3 text-3xl font-bold leading-tight sm:text-5xl">От сигнала — к первому действию из желаемой позиции</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Выберите намерение и место. Система соберёт рабочий бриф: позиция, объект, инструменты, первое действие и доказательство результата.
          </p>
        </div>

        <div className="mb-6 grid gap-2 rounded-xl border border-border/60 bg-card/50 p-2 sm:grid-cols-3">
          {INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIntent(item.id)}
              className={`rounded-lg px-4 py-3 text-left text-sm transition-colors ${intent === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <section className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-mono tracking-widest text-primary">ШАГ 1 · МЕСТО</p>
                <h2 className="text-xl font-semibold">Выберите окно возможностей</h2>
              </div>
              <Map className="h-6 w-6 text-primary" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {routes.map((route) => {
                const active = selected.id === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setRouteId(route.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${active ? "border-primary bg-primary/10 glow-cyan" : "border-border/60 bg-background/30 hover:border-primary/40"}`}
                  >
                    <div className="mb-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-primary">СРТ-{route.level}</span>
                      <span className={route.window === "Сужается" ? "text-amber-300" : "text-emerald-400"}>{route.window}</span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-snug">{route.title}</h3>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{route.description}</p>
                    <p className="text-[11px] leading-relaxed text-foreground/70">Почему сейчас: {route.whyNow}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-xl border border-primary/25 bg-card/70 p-5 sm:p-6">
            <p className="mb-1 text-[11px] font-mono tracking-widest text-primary">ШАГ 2 · ПОЗИЦИЯ</p>
            <h2 className="mb-2 text-xl font-semibold">{selected.position}</h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{selected.mission}</p>

            <div className="space-y-4 border-y border-border/60 py-4 text-sm">
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">ОБЪЕКТ</p>
                <p>{selected.object}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">ПЕРВОЕ ДЕЙСТВИЕ</p>
                <p className="text-primary">{selected.firstAction}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">ПРОДУКТИВНЫЙ ВЫХОД</p>
                <p>{selected.result}</p>
              </div>
            </div>

            <div className="my-5 flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
              <Clock3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] text-muted-foreground">ВРЕМЯ ДО ПЕРВОГО ДЕЙСТВИЯ</p>
                <p className="font-mono text-lg text-primary">{selected.timeToActionMinutes} мин</p>
              </div>
            </div>

            <a
              href={ekenUrl}
              target="_blank"
              rel="noreferrer"
              data-umami-event="position-eken-handoff"
              data-umami-event-position={selected.id}
              className="mb-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground no-underline transition-opacity hover:opacity-90"
            >
              Собрать маршрут в Eken <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setBriefOpen(true)}
              data-umami-event="position-brief-open"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary/35 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Показать бриф
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              Если автоматическая передача не сработает, скопируйте готовый бриф вручную.
            </p>
          </aside>
        </div>
      </main>

      <Footer />

      {briefOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="brief-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-primary/30 bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border/60 p-4 sm:p-5">
              <div>
                <p className="mb-1 text-[11px] font-mono tracking-widest text-primary">РУЧНАЯ ПЕРЕДАЧА</p>
                <h2 id="brief-title" className="text-xl font-semibold">Готовый бриф для Eken</h2>
              </div>
              <button type="button" onClick={() => setBriefOpen(false)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-4 sm:p-5">
              <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-background/70 p-4 font-mono text-xs leading-relaxed text-foreground/90">{brief}</pre>
            </div>
            <div className="grid gap-2 border-t border-border/60 p-4 sm:grid-cols-2 sm:p-5">
              <button
                type="button"
                onClick={copyBrief}
                data-umami-event="position-brief-copy"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Бриф скопирован" : "Копировать бриф"}
              </button>
              <a href="https://app.ekenlab.com/" target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground no-underline hover:bg-muted">
                Открыть Eken <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
