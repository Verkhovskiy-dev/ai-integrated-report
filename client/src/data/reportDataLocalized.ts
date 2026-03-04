/*
 * Localized wrappers for reportData.ts
 * Provides locale-aware getters for SRT_LEVELS, events, shifts, signals, etc.
 */
import type { Locale } from "@/contexts/I18nContext";
import {
  SRT_LEVELS as SRT_LEVELS_RU,
  HEATMAP_DATA,
  KEY_METRICS as KEY_METRICS_RU,
  TOP_COMPANIES,
  STRUCTURAL_SHIFTS as SHIFTS_RU,
  WEAK_SIGNALS as SIGNALS_RU,
  CROSS_LEVEL_CONNECTIONS as CONNECTIONS_RU,
  THEME_FREQUENCY as THEMES_RU,
  KEY_EVENTS as EVENTS_RU,
  EVENT_TYPE_LABELS as EVENT_TYPE_LABELS_RU,
  EVENT_TYPE_COLORS,
  REPORT_PERIOD,
} from "./reportData";

// ── SRT Levels ──────────────────────────────────────────────
const SRT_LEVELS_EN = [
  { id: 9, name: "Monetary System", short: "Capital", color: "#ef4444", group: "upper" },
  { id: 8, name: "Institutions of Spontaneous Order", short: "Institutions", color: "#f97316", group: "upper" },
  { id: 7, name: "Knowledge Production", short: "Knowledge", color: "#eab308", group: "upper" },
  { id: 6, name: "Production Technologies", short: "Technologies", color: "#f59e0b", group: "middle" },
  { id: 5, name: "Inter-firm Division of Labor", short: "Value Chain", color: "#22d3ee", group: "middle" },
  { id: 4, name: "Hardware Technologies", short: "Hardware", color: "#06b6d4", group: "middle" },
  { id: 3, name: "Socio-professional Structure", short: "Professions", color: "#10b981", group: "lower" },
  { id: 2, name: "Spatial Organization", short: "Geography", color: "#34d399", group: "lower" },
  { id: 1, name: "Natural Resources", short: "Resources", color: "#6ee7b7", group: "lower" },
];

export function getSrtLevels(locale: Locale) {
  return locale === "en" ? SRT_LEVELS_EN : SRT_LEVELS_RU;
}

// ── Key Metrics ─────────────────────────────────────────────
const KEY_METRICS_EN = [
  { label: "Reports", value: 14, suffix: "", icon: "FileText" },
  { label: "Unique Events", value: 187, suffix: "+", icon: "Zap" },
  { label: "Structural Shifts", value: 38, suffix: "", icon: "TrendingUp" },
  { label: "Weak Signals", value: 62, suffix: "", icon: "Radio" },
  { label: "Companies Mentioned", value: 45, suffix: "+", icon: "Building2" },
  { label: "Sources", value: 120, suffix: "+", icon: "Link" },
];

export function getKeyMetrics(locale: Locale) {
  return locale === "en" ? KEY_METRICS_EN : KEY_METRICS_RU;
}

// ── Event Type Labels ───────────────────────────────────────
const EVENT_TYPE_LABELS_EN: Record<string, string> = {
  investment: "Investment",
  product: "Product",
  regulation: "Regulation",
  geopolitics: "Geopolitics",
  government: "Government",
  milestone: "Milestone",
  social: "Social",
  partnership: "Partnership",
  market: "Market",
};

export function getEventTypeLabels(locale: Locale) {
  return locale === "en" ? EVENT_TYPE_LABELS_EN : EVENT_TYPE_LABELS_RU;
}

// ── Key Events ──────────────────────────────────────────────
const EVENTS_EN = [
  { date: "Jan 30", event: "Amazon: $200B data center CapEx plan", level: 9, type: "investment" },
  { date: "Jan 30", event: "Nvidia: DeepSeek tech support — accusations of aiding", level: 8, type: "geopolitics" },
  { date: "Jan 31", event: "Nvidia invests in OpenAI — largest investment", level: 9, type: "investment" },
  { date: "Jan 31", event: "OpenAI Prism — vibe coding for science", level: 6, type: "product" },
  { date: "Feb 1", event: "DHS uses Google Veo 3 for public materials", level: 8, type: "government" },
  { date: "Feb 3", event: "California: AI regulation for lawyers", level: 8, type: "regulation" },
  { date: "Feb 5", event: "OpenAI Frontier — platform for AI coworkers", level: 5, type: "product" },
  { date: "Feb 5", event: "Goodfire: $1.25B valuation for model interpretability", level: 6, type: "investment" },
  { date: "Feb 5", event: "Alphabet: record CapEx on AI infrastructure", level: 9, type: "investment" },
  { date: "Feb 6", event: "Big Tech: $650B total AI CapEx in 2026", level: 9, type: "investment" },
  { date: "Feb 6", event: "Chip industry reaches $1T revenue", level: 4, type: "milestone" },
  { date: "Feb 7", event: "Anthropic: >$20B funding round", level: 9, type: "investment" },
  { date: "Feb 7", event: "Coursera + Udemy: merger for AI education", level: 3, type: "product" },
  { date: "Feb 7", event: "Malaysia: first protest against data centers", level: 1, type: "social" },
  { date: "Feb 10", event: "BNP Paribas — Mistral AI: 3-year contract", level: 5, type: "partnership" },
  { date: "Feb 11", event: "Cisco: margin squeeze due to memory prices", level: 5, type: "market" },
  { date: "Feb 12", event: "Samsung: commercial HBM4 shipments begin", level: 4, type: "milestone" },
  { date: "Feb 12", event: "Nscale: $1.4B chip-loan for GPU leasing", level: 9, type: "investment" },
  { date: "Feb 12", event: "Check Point: record $1B billings on AI demand", level: 5, type: "market" },
  { date: "Feb 12", event: "Chinese open-weight models surpass Western by downloads", level: 8, type: "milestone" },
];

export function getKeyEvents(locale: Locale) {
  return locale === "en" ? EVENTS_EN : EVENTS_RU;
}

// ── Theme Frequency ─────────────────────────────────────────
const THEMES_EN = [
  { theme: "Agent Safety", count: 12, color: "#ef4444" },
  { theme: "AI-CapEx / Infrastructure", count: 11, color: "#22d3ee" },
  { theme: "Chips & Memory (HBM)", count: 10, color: "#f59e0b" },
  { theme: "Open-weight Models", count: 8, color: "#10b981" },
  { theme: "AI Regulation", count: 8, color: "#8b5cf6" },
  { theme: "Geopolitics (US-China)", count: 7, color: "#f97316" },
  { theme: "Agentic Platforms", count: 7, color: "#06b6d4" },
  { theme: "Cybersecurity", count: 6, color: "#ec4899" },
  { theme: "Data Centers / Energy", count: 5, color: "#84cc16" },
  { theme: "AI Labor Market", count: 4, color: "#a855f7" },
];

export function getThemeFrequency(locale: Locale) {
  return locale === "en" ? THEMES_EN : THEMES_RU;
}

// ── Structural Shifts ───────────────────────────────────────
const SHIFTS_EN = [
  {
    id: 1,
    title: "Financialization of Compute",
    from: "VC/equity financing of AI through Big Tech",
    to: "GPU/chips as objects of credit and leasing via bond market",
    mechanism: "AI-CapEx is packaged into debt instruments and asset-backed schemes. Strategic understanding of these processes is covered in the SKOLKOVO program 'Business Management with AI and Data'.",
    levels: [9, 5, 2, 4],
    frequency: 8,
    trend: "accelerating",
    relevantPrograms: ["ubnd", "aiShift"],
  },
  {
    id: 2,
    title: "Open-weight as Global Standard",
    from: "Dominance of Western closed APIs",
    to: "Chinese open-weight models as basic building blocks",
    mechanism: "Permissive licenses + cost/efficiency + network effect. Practical model work is covered in the SKOLKOVO 'Generative AI Intensive'.",
    levels: [8, 7, 6, 5],
    frequency: 7,
    trend: "accelerating",
    relevantPrograms: ["intensiveAI", "intensiveAgents"],
  },
  {
    id: 3,
    title: "Agent Safety: From Prompts to Boundaries",
    from: "Guardrails/filters at text level",
    to: "Boundary-based security (identity, tools, data, audit)",
    mechanism: "Growth of prompt injection + incidents → demand for deterministic perimeters. Practical skills in the SKOLKOVO 'AI Product Development Intensive'.",
    levels: [6, 8, 5],
    frequency: 10,
    trend: "accelerating",
    relevantPrograms: ["intensiveAgents", "intensiveAI"],
  },
  {
    id: 4,
    title: "From Models to Operational Platforms",
    from: "Companies buy access to LLMs",
    to: "Agent deployment platforms (rights management, policies, audit)",
    mechanism: "Enterprise layer for AI coworkers with guardrails and access control. Systematic transformation approach in the SKOLKOVO 'AI Transition' program.",
    levels: [5, 6, 8],
    frequency: 6,
    trend: "emerging",
    relevantPrograms: ["aiShift", "intensiveAgents"],
  },
  {
    id: 5,
    title: "CapEx for the Intelligence Factory",
    from: "AI investments = GPU/cloud",
    to: "Systemic CapEx: DC + cooling + power supply + supply chains",
    mechanism: "$650B Big Tech CapEx + growth in HVAC/energy. Data-driven analysis approach in the SKOLKOVO 'Data-Driven Management' program.",
    levels: [9, 4, 2, 1],
    frequency: 9,
    trend: "accelerating",
    relevantPrograms: ["dataDriven", "ubnd"],
  },
  {
    id: 6,
    title: "Regulation: From Technologies to Professions",
    from: "General discussions about AI regulation",
    to: "Specific liability regimes (legal AI, age verification, government content)",
    mechanism: "Industry-specific bills and enforcement design. Marketing and legal aspects of AI in the SKOLKOVO 'AI in Marketing' program.",
    levels: [8, 7, 3],
    frequency: 5,
    trend: "emerging",
    relevantPrograms: ["aiMarketing", "aiShift"],
  },
];

export function getStructuralShifts(locale: Locale) {
  return locale === "en" ? SHIFTS_EN : SHIFTS_RU;
}

// ── Weak Signals ────────────────────────────────────────────
const SIGNALS_EN = [
  {
    id: 1,
    title: "Debt Financing of AI Infrastructure as Market Norm",
    level: 9,
    urgency: "high",
    description: "Bond issuance for AI-CapEx is becoming standard, creating revaluation risks when rates change",
  },
  {
    id: 2,
    title: "Consumer Boycotts of AI Platforms",
    level: 8,
    urgency: "medium",
    description: "QuitGPT and similar campaigns as a new pressure mechanism on AI companies. AI marketing risks are covered in the SKOLKOVO 'AI in Marketing' program.",
    relevantPrograms: ["aiMarketing"],
  },
  {
    id: 3,
    title: "Anti-contamination Benchmarks",
    level: 7,
    urgency: "medium",
    description: "Continuously updated benchmarks as a new standard for model quality legitimation",
  },
  {
    id: 4,
    title: "Formal Agent Safety Guarantees",
    level: 6,
    urgency: "high",
    description: "Shift to cryptographic/formal guarantees instead of LLM-as-a-judge. Agent safety practice in the SKOLKOVO 'AI Product Development Intensive'.",
    relevantPrograms: ["intensiveAgents"],
  },
  {
    id: 5,
    title: "Model Market Segmentation by Jurisdiction",
    level: 5,
    urgency: "medium",
    description: "Banks lock in contracts with regional providers (BNP–Mistral)",
  },
  {
    id: 6,
    title: "Memory Tax for the AI Economy",
    level: 4,
    urgency: "high",
    description: "HBM4 and memory prices are reshaping downstream player margins. Data analytics for management decisions in the SKOLKOVO 'Business Management with AI and Data' program.",
    relevantPrograms: ["ubnd", "dataDriven"],
  },
  {
    id: 7,
    title: "Agent Ops as a New Market",
    level: 3,
    urgency: "medium",
    description: "Agent management platforms will become a separate nodal position. Practical agent system skills in the SKOLKOVO 'AI Product Development Intensive'.",
    relevantPrograms: ["intensiveAgents", "intensiveAI"],
  },
  {
    id: 8,
    title: "AI Water Footprint",
    level: 2,
    urgency: "high",
    description: "Protests against data centers over water/ecology — harbinger of serial restrictions",
  },
  {
    id: 9,
    title: "Social License for Computing",
    level: 1,
    urgency: "medium",
    description: "Transition from land/energy optimization to the need for public consent",
  },
  {
    id: 10,
    title: "SaaSpocalypse and Application Software Revaluation",
    level: 5,
    urgency: "medium",
    description: "Shift in investment logic from SaaS multiples to the question of defensible value layer. Strategic business positioning in the SKOLKOVO 'AI Transition' program.",
    relevantPrograms: ["aiShift", "ubnd"],
  },
  {
    id: 11,
    title: "Compute Landlord Model",
    level: 2,
    urgency: "medium",
    description: "GPUs/chips are rented out — development of a rental model for computing power",
  },
  {
    id: 12,
    title: "Tech Support Jurisdiction",
    level: 8,
    urgency: "high",
    description: "SDK advice may qualify as aiding model development in restricted countries",
  },
];

export function getWeakSignals(locale: Locale) {
  return locale === "en" ? SIGNALS_EN : SIGNALS_RU;
}

// ── Cross-Level Connections ─────────────────────────────────
const CONNECTIONS_EN = [
  {
    id: 1,
    title: "Memory-price shock → margin pressure → investment expectations",
    from: 4,
    to: 9,
    through: [5],
    description: "Rising memory chip prices worsen profit forecasts for IT vendors",
  },
  {
    id: 2,
    title: "Financial instruments → infrastructure providers → geography",
    from: 9,
    to: 2,
    through: [5],
    description: "Bond issuance and chip-loans create a scalable mechanism for capacity expansion",
  },
  {
    id: 3,
    title: "Open-weight models → development standards → monetization",
    from: 8,
    to: 9,
    through: [6, 5],
    description: "Open-weight as infrastructure pressures SaaS monetization of closed models",
  },
  {
    id: 4,
    title: "Agent threats → security vendors → boundary security norms",
    from: 4,
    to: 8,
    through: [5, 6],
    description: "Growth of AI fraud increases demand for cyber products and standards",
  },
  {
    id: 5,
    title: "Big Tech CapEx → $1T chip industry → geography of capacity",
    from: 9,
    to: 2,
    through: [4],
    description: "$650B CapEx cements Big Tech as pipeline organizers",
  },
  {
    id: 6,
    title: "Government GenAI procurement → value conflicts → workforce risks",
    from: 8,
    to: 3,
    through: [5],
    description: "Government use of AI creates ethical conflicts within companies",
  },
];

export function getCrossLevelConnections(locale: Locale) {
  return locale === "en" ? CONNECTIONS_EN : CONNECTIONS_RU;
}

// Re-export unchanged data
export { HEATMAP_DATA, TOP_COMPANIES, EVENT_TYPE_COLORS, REPORT_PERIOD };
