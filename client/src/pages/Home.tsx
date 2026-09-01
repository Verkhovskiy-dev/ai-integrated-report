/*
 * DESIGN: "Командный Пункт" — Intelligence Dashboard
 * Dark navy background, cyan/amber/magenta accents
 * Space Grotesk headings, IBM Plex Sans body, IBM Plex Mono data
 * Mobile-first responsive layout
 *
 * LAYOUT ORDER:
 * 1. Header + FilterBar (sticky)
 * 2. NewsTicker (Bloomberg-style scrolling bar)
 * 3. HeroSummary — executive summary first screen (metrics, top 3, momentum, insight)
 * 4. LatestNews — remaining events (collapsible)
 * 5. TrendCharts — detailed momentum panels
 * 6. MetricsBar — hero section with key numbers
 * 7. Heatmap, Insights, Themes, Shifts, etc.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import Header from "@/components/Header";
import ExecutiveSummaryBar from "@/components/ExecutiveSummaryBar";
import FilterBar from "@/components/FilterBar";
import NewsTicker from "@/components/NewsTicker";
import HeroSummary from "@/components/HeroSummary";
import LatestNews from "@/components/LatestNews";
import MetricsBar from "@/components/MetricsBar";
import TrendCharts from "@/components/TrendCharts";
import HeatmapSection from "@/components/HeatmapSection";
import StrategicInsights from "@/components/StrategicInsights";
import StructuralShifts from "@/components/StructuralShifts";
import WeakSignalsRadar from "@/components/WeakSignalsRadar";
import CrossLevelConnections from "@/components/CrossLevelConnections";
import TopCompanies from "@/components/TopCompanies";
import ThemeFrequency from "@/components/ThemeFrequency";
import NodalPositions from "@/components/NodalPositions";
import WeekOverWeek from "@/components/WeekOverWeek";
import Forecasts from "@/components/Forecasts";
import Footer from "@/components/Footer";
import ProgramsTeaser from "@/components/ProgramsTeaser";
import AiProSpotlight from "@/components/AiProSpotlight";
import ShareableBlock from "@/components/ShareableBlock";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("news");
  const { locale } = useTranslation();
  const { isExecutive } = useViewMode();

  // Нативная навигация: открытие по #hash и кнопки назад/вперёд
  useEffect(() => {
    const scrollWithRetry = (id: string, attempts = 12) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        el.classList.add("shared-item-target");
        window.setTimeout(() => el.classList.remove("shared-item-target"), 2800);
        return;
      }
      if (attempts > 0) setTimeout(() => scrollWithRetry(id, attempts - 1), 250);
    };
    const applyHash = () => {
      const id = window.location.hash.replace("#", "") || new URLSearchParams(window.location.search).get("share") || "";
      if (!id) return;
      setActiveSection(id);
      scrollWithRetry(id);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    document.title = locale === 'en'
      ? 'AI Integrated Report \u2014 Strategic Dashboard'
      : 'AI Integrated Report \u2014 \u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0414\u0430\u0448\u0431\u043e\u0440\u0434';
  }, [locale]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip">
      {/* Subtle scan line overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-20 scan-line hidden sm:block" />

      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      <ExecutiveSummaryBar />
      <FilterBar />

      <main className="relative z-10">
        <h1 className="sr-only">
          {locale === "en" ? "AI Strategic Intelligence Report" : "Стратегический аналитический отчёт об искусственном интеллекте"}
        </h1>
        {/* Bloomberg-style News Ticker */}
        <NewsTicker />

        {/* === FIRST SCREEN: Executive Summary === */}
        <ShareableBlock id="hero-summary" title={locale === "en" ? "Executive summary" : "Главное за неделю"}>
          <HeroSummary />
        </ShareableBlock>

        {/* AI PRO — таргет на executive-аудиторию */}
        {isExecutive && (
          <section className="py-3">
            <div className="container">
              <AiProSpotlight source="executive" />
            </div>
          </section>
        )}

        {/* === Remaining Events (collapsible) === */}
        <ShareableBlock id="news" title={locale === "en" ? "Latest AI events" : "Последние события в AI"}>
          <LatestNews />
        </ShareableBlock>

        {/* === Detailed Trend Momentum Panels === */}
        <ShareableBlock id="trends" title={locale === "en" ? "AI trend dynamics" : "Динамика AI-трендов"}>
          <TrendCharts />
        </ShareableBlock>

        {/* Hero / Metrics Bar */}
        <MetricsBar />

        {/* Heatmap: Activity by Level and Date */}
        <ShareableBlock id="heatmap" title={locale === "en" ? "Activity heatmap" : "Карта активности"}>
          <section id="heatmap" className="py-6 sm:py-10"><HeatmapSection /></section>
        </ShareableBlock>

        {/* Strategic Insights — with program links + executive role advice */}
        <ShareableBlock id="insights" title={locale === "en" ? "Strategic insights" : "Стратегические инсайты"}>
          <section id="insights" className="scroll-mt-28 py-6 sm:scroll-mt-32 sm:py-10"><StrategicInsights /></section>
        </ShareableBlock>

        {/* SKOLKOVO programs teaser - insight-linked, full catalog at /programs */}
        <section id="programs" className="py-6 sm:py-10">
          <ProgramsTeaser />
        </section>

        {/* Two-column layout: Themes + Companies */}
        <ShareableBlock id="themes" title={locale === "en" ? "Themes and companies" : "Темы и компании"}>
        <section id="themes" className="py-6 sm:py-10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <ThemeFrequency />
              <TopCompanies />
            </div>
          </div>
        </section>
        </ShareableBlock>

        {/* Structural Shifts */}
        <ShareableBlock id="shifts" title={locale === "en" ? "Structural shifts" : "Структурные сдвиги"}>
          <section id="shifts" className="py-6 sm:py-10"><StructuralShifts /></section>
        </ShareableBlock>

        {/* AI PRO — мостик из сдвигов */}
        <section className="pb-6 sm:pb-10 -mt-2">
          <div className="container">
            <AiProSpotlight source="shifts" />
          </div>
        </section>

        {/* Cross-Level Connections */}
        <ShareableBlock id="connections" title={locale === "en" ? "Cross-level connections" : "Связи между уровнями"}>
          <section id="connections" className="py-6 sm:py-10"><CrossLevelConnections /></section>
        </ShareableBlock>

        {/* Weak Signals Radar */}
        <ShareableBlock id="signals" title={locale === "en" ? "Weak signals radar" : "Радар слабых сигналов"}>
          <section id="signals" className="py-6 sm:py-10"><WeakSignalsRadar /></section>
        </ShareableBlock>

        {/* Week-over-Week Comparison */}
        <ShareableBlock id="wow" title={locale === "en" ? "Week-over-week comparison" : "Сравнение неделя к неделе"}>
          <section id="wow" className="py-6 sm:py-10"><WeekOverWeek /></section>
        </ShareableBlock>

        {/* Forecasts */}
        <ShareableBlock id="forecasts" title={locale === "en" ? "AI forecasts" : "Прогнозы AI"}>
          <section id="forecasts" className="py-6 sm:py-10"><Forecasts /></section>
        </ShareableBlock>

        {/* Nodal Positions + Education Recommendations */}
        <section id="positions" className="py-6 sm:py-10">
          <NodalPositions />
        </section>

        {/* ÐÑÑÐ¸Ð² Ð¾ÑÑÑÑÐ¾Ð² Ð¿Ð¾ Ð´Ð½ÑÐ¼ (ÑÑÐ°ÑÐ¸ÑÐµÑÐºÐ¸Ðµ ÑÑÑÐ°Ð½Ð¸ÑÑ) */}
        <section id="archive" className="py-8 sm:py-12 text-center">
          <a
            href="/reports/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 bg-primary/10 text-primary text-sm font-mono hover:bg-primary/20 transition-colors"
          >
            {locale === "en" ? "Daily report archive →" : "Архив отчётов по дням →"}
          </a>
        </section>
      </main>

      <Footer />

    </div>
  );
}
