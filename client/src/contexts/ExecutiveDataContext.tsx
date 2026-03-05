/*
 * ExecutiveDataContext: Loads and provides executive-mode data
 * (simplified explanations, role-based advice, weekly takeaways,
 * industry personalizations) from JSON files.
 *
 * Data is lazy-loaded only when executive mode is activated.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useViewMode } from "./ViewModeContext";
import { useTranslation, type Locale } from "./I18nContext";

/* ── Types ─────────────────────────────────────────────────── */

export interface ExecutiveEvent {
  event_title: string;
  what_happened: string;
  why_important: string;
  business_impact: string;
}

export interface RoleAdvice {
  insight_id: number;
  ceo: string;
  cto: string;
  cdo: string;
}

export interface WeeklyTakeaway {
  situation: string;
  risk_or_opportunity: "risk" | "opportunity" | "both";
  risk_opportunity_text: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface IndustryPersonalization {
  industry: string;
  key_impacts: string[];
  opportunities: string[];
  risks: string[];
  immediate_actions: string[];
}

export interface ExecutiveData {
  executive_events: ExecutiveEvent[];
  role_advice: RoleAdvice[];
  weekly_takeaways: WeeklyTakeaway[];
  industry_personalizations: IndustryPersonalization[];
}

interface ExecutiveDataContextValue {
  data: ExecutiveData | null;
  loading: boolean;
  error: string | null;
  /** Find executive explanation for an event by title (fuzzy first-40-chars match) */
  getEventExplanation: (title: string) => ExecutiveEvent | undefined;
  /** Find role advice for an insight by ID */
  getRoleAdvice: (insightId: number) => RoleAdvice | undefined;
}

const ExecutiveDataContext = createContext<ExecutiveDataContextValue | null>(null);

/* ── Helpers ───────────────────────────────────────────────── */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[«»""*_]/g, "")
    .trim()
    .slice(0, 40);

const EMPTY: ExecutiveData = {
  executive_events: [],
  role_advice: [],
  weekly_takeaways: [],
  industry_personalizations: [],
};

/* ── Provider ──────────────────────────────────────────────── */

export function ExecutiveDataProvider({ children }: { children: ReactNode }) {
  const { isExecutive } = useViewMode();
  const { locale } = useTranslation();
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedLocale, setLoadedLocale] = useState<Locale | null>(null);

  useEffect(() => {
    // Only load when executive mode is active and locale changed
    if (!isExecutive) return;
    if (data && loadedLocale === locale) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL || "/";
    const url = `${base}data/executive_data_${locale}.json`;

    fetch(url)
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      })
      .then((json: ExecutiveData) => {
        if (!cancelled) {
          setData(json);
          setLoadedLocale(locale);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load executive data:", err);
        if (!cancelled) {
          setData(EMPTY);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isExecutive, locale]);

  const getEventExplanation = (title: string): ExecutiveEvent | undefined => {
    if (!data) return undefined;
    const needle = normalize(title);
    return data.executive_events.find((e) => normalize(e.event_title) === needle);
  };

  const getRoleAdvice = (insightId: number): RoleAdvice | undefined => {
    if (!data) return undefined;
    return data.role_advice.find((a) => a.insight_id === insightId);
  };

  return (
    <ExecutiveDataContext.Provider
      value={{ data, loading, error, getEventExplanation, getRoleAdvice }}
    >
      {children}
    </ExecutiveDataContext.Provider>
  );
}

export function useExecutiveData() {
  const ctx = useContext(ExecutiveDataContext);
  if (!ctx)
    throw new Error("useExecutiveData must be used within ExecutiveDataProvider");
  return ctx;
}
