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
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

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
    if (loadedKey === requestKey) return;

    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL || "/";
    const url = `${base}data/executive_data_${locale}.json`;

    fetch(url)
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      })
      .then(async (json: unknown) => {
        const validated = await validateExecutiveNewsData(latestReport, json);
        const optional = json as Partial<ExecutiveData>;
        const normalized: ExecutiveData = {
          ...validated,
          role_advice: Array.isArray(optional.role_advice) ? optional.role_advice : [],
          weekly_takeaways: Array.isArray(optional.weekly_takeaways) ? optional.weekly_takeaways : [],
          industry_personalizations: Array.isArray(optional.industry_personalizations) ? optional.industry_personalizations : [],
        };
        if (!cancelled) {
          setData(normalized);
          setLoadedKey(requestKey);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load executive data:", err);
        if (!cancelled) {
          setData(EMPTY);
          setLoadedKey(requestKey);
          setError(String(err?.message || err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isExecutive, locale, latestReport, loadedKey]);

  const getEventExplanation = (event: ContractNewsEvent): ExecutiveLookup =>
    findExecutiveExplanation(event, data);

  const getRoleAdvice = (insightId: number): RoleAdvice | undefined => {
    return (data?.role_advice ?? []).find((a) => a.insight_id === insightId);
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
