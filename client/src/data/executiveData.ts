/*
 * Executive-mode data: simplified explanations, role-based advice,
 * weekly takeaways, and industry personalizations.
 * Generated via LLM from dashboard report data.
 */

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

type Locale = "ru" | "en";

let cachedData: Record<Locale, ExecutiveData | null> = { ru: null, en: null };

const BASE = import.meta.env.BASE_URL || "/";

export async function loadExecutiveData(locale: Locale): Promise<ExecutiveData> {
  if (cachedData[locale]) return cachedData[locale]!;
  try {
    const resp = await fetch(`${BASE}data/executive_data_${locale}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data: ExecutiveData = await resp.json();
    cachedData[locale] = data;
    return data;
  } catch (err) {
    console.warn("Failed to load executive data, using fallback", err);
    return FALLBACK;
  }
}

export function getExecutiveEventByTitle(
  events: ExecutiveEvent[],
  title: string
): ExecutiveEvent | undefined {
  // Fuzzy match: normalize and compare first 40 chars
  const normalize = (s: string) => s.toLowerCase().replace(/[«»""]/g, "").trim().slice(0, 40);
  const needle = normalize(title);
  return events.find((e) => normalize(e.event_title) === needle);
}

export function getRoleAdviceByInsightId(
  advices: RoleAdvice[],
  id: number
): RoleAdvice | undefined {
  return advices.find((a) => a.insight_id === id);
}

const FALLBACK: ExecutiveData = {
  executive_events: [],
  role_advice: [],
  weekly_takeaways: [],
  industry_personalizations: [],
};
