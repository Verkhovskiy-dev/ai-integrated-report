/*
 * ExecutiveDataContext: Loads and provides executive-mode data
 * (simplified explanations, role-based advice, weekly takeaways,
 * industry personalizations) from JSON files.
 *
 * Data is lazy-loaded only when executive mode is activated.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useViewMode } from "./ViewModeContext";
import { useTranslation } from "./I18nContext";
import { useLiveData } from "./LiveDataContext";
import { startLiveRefresh } from "@/lib/liveRefresh";
import {
  findExecutiveExplanation,
  validateExecutiveNewsData,
  type ContractNewsEvent,
  type ExecutiveExplanation,
  type ExecutiveLookup,
  type ExecutiveNewsData,
} from "@/data/newsContract";

/* ── Types ─────────────────────────────────────────────────── */

export type ExecutiveEvent = ExecutiveExplanation;

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

export interface ExecutiveData extends ExecutiveNewsData {
  role_advice: RoleAdvice[];
  weekly_takeaways: WeeklyTakeaway[];
  industry_personalizations: IndustryPersonalization[];
}

interface ExecutiveDataContextValue {
  data: ExecutiveData | null;
  loading: boolean;
  error: string | null;
  /** Find an explanation only by versioned event identity. */
  getEventExplanation: (event: ContractNewsEvent) => ExecutiveLookup;
  /** Find role advice for an insight by ID */
  getRoleAdvice: (insightId: number) => RoleAdvice | undefined;
}

const ExecutiveDataContext = createContext<ExecutiveDataContextValue | null>(null);

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
  const { latestReport } = useLiveData();
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLocale, setDataLocale] = useState<string | null>(null);

  useEffect(() => {
    if (!isExecutive) return;
    const reportVersion = latestReport?.content_version;
    const requestKey = reportVersion ? `${locale}:${reportVersion}` : null;
    if (!requestKey) {
      setData(EMPTY);
      setError("Loaded report has no verified news contract");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL || "/";
    const url = `${base}data/executive_data_${locale}.json`;

    let accepted = false;
    const stopRefresh = startLiveRefresh(async (signal) => {
      try {
        const resp = await fetch(url, { cache: "no-cache", signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: unknown = await resp.json();
        const validated = await validateExecutiveNewsData(latestReport, json);
        const optional = json as Partial<ExecutiveData>;
        const normalized: ExecutiveData = {
          ...validated,
          role_advice: Array.isArray(optional.role_advice) ? optional.role_advice : [],
          weekly_takeaways: Array.isArray(optional.weekly_takeaways) ? optional.weekly_takeaways : [],
          industry_personalizations: Array.isArray(optional.industry_personalizations) ? optional.industry_personalizations : [],
        };
        if (!cancelled) {
          if (signal.aborted) throw new Error("Executive data request timed out");
          accepted = true;
          setData(normalized);
          setDataLocale(locale);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to load executive data:", err);
        if (!cancelled) {
          // A temporary failure must not latch this version as loaded forever.
          // Retain only an already-validated pair for this exact report.
          if (!accepted) setData(EMPTY);
          setError(String(err instanceof Error ? err.message : err));
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      stopRefresh();
    };
  }, [isExecutive, locale, latestReport]);

  // Effects run after render: never expose a prior release for even one frame.
  const currentData = dataLocale === locale && data?.report_content_version === latestReport?.content_version ? data : null;
  const getEventExplanation = (event: ContractNewsEvent): ExecutiveLookup =>
    findExecutiveExplanation(event, currentData);

  const getRoleAdvice = (insightId: number): RoleAdvice | undefined => {
    return (currentData?.role_advice ?? []).find((a) => a.insight_id === insightId);
  };

  return (
    <ExecutiveDataContext.Provider
      value={{ data: currentData, loading, error, getEventExplanation, getRoleAdvice }}
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
