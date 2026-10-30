import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, useTranslation } from "../../client/src/contexts/I18nContext";
import { ViewModeProvider } from "../../client/src/contexts/ViewModeContext";
import { LiveDataProvider, useLiveData } from "../../client/src/contexts/LiveDataContext";
import { ExecutiveDataProvider, useExecutiveData } from "../../client/src/contexts/ExecutiveDataContext";
import { FilterProvider, useFilters } from "../../client/src/contexts/FilterContext";
import LatestNews from "../../client/src/components/LatestNews";
import { TooltipProvider } from "../../client/src/components/ui/tooltip";
import "../../client/src/index.css";

function Probe() {
  const live = useLiveData(), executive = useExecutiveData(), filters = useFilters(), i18n = useTranslation();
  const [staged, setStaged] = useState("A");
  const documentId = useRef(`${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const event = live.latestReport?.srt_levels[0]?.events[0];
  const explanation = event ? executive.getEventExplanation(event) : null;
  async function stage(mode: string) {
    await fetch(`/__fixture/${mode}`, { method: "POST" });
    setStaged(mode);
  }
  return <main style={{ padding: 24 }}>
    <h1>Изоляция: настоящие providers и компонент новостей</h1>
    <p>Никакой сети production, аналитики или writer. Интервал кандидата: 60 секунд.</p>
    <p>Document ID: <output>{documentId.current}</output></p>
    <p>Fixture staged: {staged}</p>
    {["A", "B-stale-executive", "B", "error", "malformed", "older"].map(mode => <button style={{ border: "1px solid", margin: 4, padding: 8 }} key={mode} onClick={() => stage(mode)}>Stage {mode}</button>)}
    <button style={{ border: "1px solid", margin: 4, padding: 8 }} onClick={() => i18n.setLocale(i18n.locale === "ru" ? "en" : "ru")}>Switch locale</button>
    <button style={{ border: "1px solid", margin: 4, padding: 8 }} onClick={() => window.dispatchEvent(new Event("focus"))}>Test focus event</button>
    <p>Report: {live.reportDate}; locale: {i18n.locale}; loading: {String(live.loading)}; live: {String(live.isLive)}</p>
    <p>Version: {live.latestReport?.content_version}</p>
    <p>First fact: {event?.title}</p>
    <p>Explanation: {explanation?.status === "available" ? explanation.explanation.what_happened : "unavailable"}</p>
    <p>Load error: {live.error || "none"}</p>
    <label>Сохранить поиск <input aria-label="Сохранить поиск" value={filters.searchQuery} onChange={e => filters.setSearchQuery(e.target.value)} style={{ border: "1px solid" }} /></label>
    <p>Filter: {filters.searchQuery}</p>
    <LatestNews />
  </main>;
}

createRoot(document.getElementById("root")!).render(<I18nProvider><ViewModeProvider><LiveDataProvider><ExecutiveDataProvider><FilterProvider><TooltipProvider><Probe /></TooltipProvider></FilterProvider></ExecutiveDataProvider></LiveDataProvider></ViewModeProvider></I18nProvider>);
