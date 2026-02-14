/*
 * DESIGN: Bloomberg/Reuters-style News Ticker
 * Continuous horizontal scrolling marquee with trend indicators
 * Dark background, cyan text (#00ffcc), orange accents (#ff8c00)
 * Shows real-time user clock + hardcoded AI trends from dashboard data
 */
import { useEffect, useState, useRef } from "react";

interface TickerItem {
  id: number;
  text: string;
  indicator: "up" | "down" | "neutral";
  highlight?: boolean; // orange accent for important trends
  category: string;
}

const TICKER_ITEMS: Omit<TickerItem, "id">[] = [
  {
    text: "AI Agents adoption ↑ +34% за неделю",
    indicator: "up",
    highlight: true,
    category: "AGENTS",
  },
  {
    text: "Open Source LLMs ↑ DeepSeek R1 обгоняет GPT-4",
    indicator: "up",
    highlight: true,
    category: "MODELS",
  },
  {
    text: "AI в маркетинге ↑ +28% рост запросов",
    indicator: "up",
    highlight: false,
    category: "MARKETING",
  },
  {
    text: "Регуляторные риски — EU AI Act смягчён",
    indicator: "down",
    highlight: false,
    category: "REGULATION",
  },
  {
    text: "Big Tech AI-CapEx $650 млрд суммарно в 2026",
    indicator: "up",
    highlight: true,
    category: "INVESTMENT",
  },
  {
    text: "Чип-индустрия выходит на $1 трлн выручки",
    indicator: "up",
    highlight: true,
    category: "HARDWARE",
  },
  {
    text: "Безопасность агентов — топ-тема 12 из 14 отчётов",
    indicator: "up",
    highlight: false,
    category: "SECURITY",
  },
  {
    text: "Anthropic раунд >$20 млрд — рекорд AI-рынка",
    indicator: "up",
    highlight: true,
    category: "FUNDING",
  },
  {
    text: "Samsung начал поставки HBM4 — новый стандарт",
    indicator: "up",
    highlight: false,
    category: "MEMORY",
  },
  {
    text: "Nvidia инвестирует в OpenAI — стратегический альянс",
    indicator: "up",
    highlight: false,
    category: "DEALS",
  },
  {
    text: "Кибербезопасность ↑ Check Point billings $1B",
    indicator: "up",
    highlight: false,
    category: "CYBER",
  },
  {
    text: "Дата-центры — первые протесты в Малайзии",
    indicator: "down",
    highlight: false,
    category: "ESG",
  },
  {
    text: "Open-weight модели — новый глобальный стандарт",
    indicator: "up",
    highlight: true,
    category: "MODELS",
  },
  {
    text: "Финансиализация Compute — GPU как объект кредитования",
    indicator: "up",
    highlight: false,
    category: "FINANCE",
  },
  {
    text: "Agent Ops — формируется новый рынок платформ",
    indicator: "up",
    highlight: false,
    category: "PLATFORMS",
  },
  {
    text: "BNP Paribas + Mistral AI — 3-летний контракт",
    indicator: "neutral",
    highlight: false,
    category: "ENTERPRISE",
  },
];

function getIndicatorSymbol(indicator: "up" | "down" | "neutral"): string {
  switch (indicator) {
    case "up":
      return "▲";
    case "down":
      return "▼";
    case "neutral":
      return "◆";
  }
}

function getIndicatorColor(indicator: "up" | "down" | "neutral"): string {
  switch (indicator) {
    case "up":
      return "#00ffcc";
    case "down":
      return "#ff4444";
    case "neutral":
      return "#888888";
  }
}

function formatMSKTime(date: Date): string {
  // Format time in MSK (UTC+3)
  return date.toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function NewsTicker() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const tickerRef = useRef<HTMLDivElement>(null);

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const mskTime = formatMSKTime(currentTime);
  const localTime = formatLocalTime(currentTime);

  // Build items with IDs and timestamps
  const items: TickerItem[] = TICKER_ITEMS.map((item, index) => ({
    ...item,
    id: index,
  }));

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="ticker-wrapper">
      {/* Left edge: LIVE badge + clock */}
      <div className="ticker-clock">
        <span className="ticker-live-dot" />
        <span className="ticker-live-text">LIVE</span>
        <span className="ticker-time">{mskTime} MSK</span>
        <span className="ticker-separator">|</span>
        <span className="ticker-time-local">{localTime} LOCAL</span>
      </div>

      {/* Scrolling area */}
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

      {/* Right edge gradient fade */}
      <div className="ticker-fade-right" />
      <div className="ticker-fade-left" />
    </div>
  );
}
