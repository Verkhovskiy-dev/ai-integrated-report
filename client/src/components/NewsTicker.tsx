/*
 * DESIGN: Bloomberg/Reuters-style News Ticker
 * Continuous horizontal scrolling marquee with trend indicators
 * Dark background, cyan text (#00ffcc), orange accents (#ff8c00)
 * Shows real-time user clock + hardcoded AI trends from dashboard data
 * i18n support
 */
import { useEffect, useState, useRef, useMemo } from "react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";

interface TickerItem {
  id: number;
  text: string;
  indicator: "up" | "down" | "neutral";
  highlight?: boolean;
  category: string;
}

function getStaticTickerItems(isEn: boolean): Omit<TickerItem, "id">[] {
  return isEn
    ? [
        { text: "AI Agents adoption ↑ +34% this week", indicator: "up", highlight: true, category: "AGENTS" },
        { text: "Open Source LLMs ↑ DeepSeek R1 surpasses GPT-4", indicator: "up", highlight: true, category: "MODELS" },
        { text: "Big Tech AI-CapEx $650B combined in 2026", indicator: "up", highlight: true, category: "INVESTMENT" },
        { text: "Chip industry reaching $1T in revenue", indicator: "up", highlight: true, category: "HARDWARE" },
      ]
    : [
        { text: "AI Agents adoption ↑ +34% за неделю", indicator: "up", highlight: true, category: "AGENTS" },
        { text: "Open Source LLMs ↑ DeepSeek R1 обгоняет GPT-4", indicator: "up", highlight: true, category: "MODELS" },
        { text: "Big Tech AI-CapEx $650 млрд суммарно в 2026", indicator: "up", highlight: true, category: "INVESTMENT" },
        { text: "Чип-индустрия выходит на $1 трлн выручки", indicator: "up", highlight: true, category: "HARDWARE" },
      ];
}

function buildTickerFromReport(report: any): Omit<TickerItem, "id">[] {
  if (!report || !report.srt_levels) return [];
  const items: Omit<TickerItem, "id">[] = [];
  const categories = ["FINANCE", "MARKET", "TECH", "SECURITY", "MODELS", "INFRA", "REGULATION", "GEOPOLITICS", "AGENTS"];
  for (const level of report.srt_levels) {
    for (const event of level.events.slice(0, 2)) {
      const cat = categories[9 - level.level] || "AI";
      items.push({
        text: event.title,
        indicator: "up" as const,
        highlight: level.level >= 7,
        category: cat,
      });
    }
  }
  if (report.structural_shifts) {
    for (const shift of report.structural_shifts.slice(0, 3)) {
      items.push({
        text: `${shift.title}: ${shift.from} → ${shift.to}`,
        indicator: shift.trend === "accelerating" ? "up" as const : "neutral" as const,
        highlight: shift.trend === "accelerating",
        category: "SHIFT",
      });
    }
  }
  return items;
}

function getIndicatorSymbol(indicator: "up" | "down" | "neutral"): string {
  switch (indicator) {
    case "up": return "▲";
    case "down": return "▼";
    case "neutral": return "◆";
  }
}

function getIndicatorColor(indicator: "up" | "down" | "neutral"): string {
  switch (indicator) {
    case "up": return "#00ffcc";
    case "down": return "#ff4444";
    case "neutral": return "#888888";
  }
}

function formatMSKTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function NewsTicker() {
  const { latestReport, isLive } = useLiveData();
  const { locale } = useTranslation();
  const isEn = locale === "en";
  const [currentTime, setCurrentTime] = useState(new Date());
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const mskTime = formatMSKTime(currentTime);
  const localTime = formatLocalTime(currentTime);

  const TICKER_ITEMS = useMemo(() => {
    const reportItems = isLive ? buildTickerFromReport(latestReport) : [];
    return reportItems.length > 0 ? reportItems : getStaticTickerItems(isEn);
  }, [isLive, latestReport, isEn]);

  const items: TickerItem[] = TICKER_ITEMS.map((item, index) => ({
    ...item,
    id: index,
  }));

  const duplicatedItems = [...items, ...items];

  return (
    <div className="ticker-wrapper">
      <div className="ticker-clock">
        <span className="ticker-live-dot" />
        <span className="ticker-live-text">LIVE</span>
        <span className="ticker-time">{mskTime} MSK</span>
        <span className="ticker-separator">|</span>
        <span className="ticker-time-local">{localTime} LOCAL</span>
      </div>

      <div className="ticker-scroll-area" ref={tickerRef}>
        <div className="ticker-track">
          {duplicatedItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="ticker-item">
              <span
                className="ticker-category"
                style={{
                  color: item.highlight ? "#ff8c00" : "rgba(0, 255, 204, 0.5)",
                }}
              >
                {item.category}
              </span>
              <span
                className="ticker-indicator"
                style={{ color: getIndicatorColor(item.indicator) }}
              >
                {getIndicatorSymbol(item.indicator)}
              </span>
              <span
                className="ticker-text"
                style={{
                  color: item.highlight ? "#ff8c00" : "#00ffcc",
                }}
              >
                {item.text}
              </span>
              <span className="ticker-timestamp">• {mskTime}</span>
              <span className="ticker-divider">│</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ticker-fade-right" />
      <div className="ticker-fade-left" />
    </div>
  );
}
