/*
 * Localized wrappers for insightsData.ts
 * Provides locale-aware getters for insights, nodal positions, recommendations, programs.
 */
import type { Locale } from "@/contexts/I18nContext";
import {
  SKOLKOVO_PROGRAMS as PROGRAMS_RU,
  STRATEGIC_INSIGHTS as INSIGHTS_RU,
  NODAL_POSITIONS as NODAL_RU,
  EDUCATION_RECOMMENDATIONS as EDU_RU,
  type ProgramLink,
  type StrategicInsight,
  type NodalPosition,
  type EducationRecommendation,
} from "./insightsData";

// ── SKOLKOVO Programs ───────────────────────────────────────
const PROGRAMS_EN: Record<string, ProgramLink> = {
  aiShift: {
    name: "'AI Transition: Business Process Transformation'",
    shortName: "AI Transition",
    url: "https://www.skolkovo.ru/~sk-7ZVJt",
  },
  intensiveAI: {
    name: "'Generative AI & Algorithms Intensive'",
    shortName: "AI Intensive",
    url: "https://www.skolkovo.ru/~sk-wCora",
  },
  intensiveAgents: {
    name: "'AI Product Development Online Intensive'",
    shortName: "Agents Intensive",
    url: "https://www.skolkovo.ru/~sk-QoLZT",
  },
  onlineIntensiveAI: {
    name: "'Online AI Intensive'",
    shortName: "Online AI Intensive",
    url: "https://www.skolkovo.ru/~sk-eei2Y",
  },
  dataDriven: {
    name: "'Transition to Data-Driven Management'",
    shortName: "Data-Driven",
    url: "https://www.skolkovo.ru/~sk-kwLAi",
  },
  ubnd: {
    name: "'Business Management with AI and Data'",
    shortName: "AI & Data Mgmt",
    url: "https://www.skolkovo.ru/~sk-dalgV",
  },
  aiMarketing: {
    name: "'AI in Marketing'",
    shortName: "AI in Marketing",
    url: "https://www.skolkovo.ru/~sk-vqTJ0",
  },
  productDirector: {
    name: "'Product Director'",
    shortName: "Product Director",
    url: "https://www.skolkovo.ru/~sk-WFMlp",
  },
  aiNewMarkets: {
    name: "'AI for New Market Entry'",
    shortName: "AI for New Markets",
    url: "https://www.skolkovo.ru/~sk-8IiQC",
  },
};

export function getSkolkovoPrograms(locale: Locale): Record<string, ProgramLink> {
  return locale === "en" ? PROGRAMS_EN : PROGRAMS_RU;
}

// ── Strategic Insights ──────────────────────────────────────
const INSIGHTS_EN: StrategicInsight[] = [
  {
    id: 1,
    title: '"The Great Value Migration"',
    subtitle: "From Software to Physical Infrastructure",
    icon: "Building",
    accentColor: "#22d3ee",
    summary: "The most significant structural shift of the period — capital and strategic value flowing from the software layer to physical infrastructure: data centers, chips, memory, cooling, energy.",
    evidence: [
      "$650B combined CapEx by Amazon/Alphabet/Meta/Microsoft for 2026 (+60% YoY)",
      "Chip industry reaches $1T revenue",
      "Oracle raises $45–50B for cloud capacity construction",
      "Samsung begins commercial HBM4 shipments",
      "Delta Electronics reaches $100B market cap, surpassing Foxconn",
    ],
    nonObviousConclusion: "Alongside the 'infrastructure boom', Bloomberg reports a 'loan meltdown' for software companies — the mid-tier SaaS layer is becoming a 'donor' for infrastructure players. Transformation isn't 'adding AI to business' — it's rebuilding the entire value chain.",
    educationImplication: "Infrastructure literacy module: compute, energy, memory and cooling as strategic resources determining competitiveness. These topics are covered in depth in the SKOLKOVO 'Business Management with AI and Data' and 'AI Transition' programs.",
    relevantPrograms: ["ubnd", "aiShift"],
  },
  {
    id: 2,
    title: '"The Agentic Revolution"',
    subtitle: "A New Market for Management and Security",
    icon: "Bot",
    accentColor: "#10b981",
    summary: "Transition from 'model answers a question' to 'agent acts autonomously' — emergence of a fundamentally new class of systems requiring their own management, security, and observability infrastructure.",
    evidence: [
      "OpenAI launches Frontier — platform for AI coworkers with guardrails",
      "Goodfire valued at $1.25B for model interpretability",
      "MIT Tech Review: prompt injection and agent goal hijack — key threats",
      "CEO guide to managing agentic system risks (MIT Tech Review)",
    ],
    nonObviousConclusion: "A new professional vertical 'Agent Ops' is emerging — analogous to DevOps/MLOps for agentic systems: rights management, access policies, action audit, 'goal drift' monitoring.",
    educationImplication: "Module on 'Agentic AI Governance': security architecture, OWASP/NIST/SAIF standards, boundary-control practices. Practical agent system skills in the SKOLKOVO 'AI Product Development Intensive'.",
    relevantPrograms: ["intensiveAgents", "intensiveAI"],
  },
  {
    id: 3,
    title: "The State — a Triple Player",
    subtitle: "Regulator, Customer, and Battleground",
    icon: "Landmark",
    accentColor: "#f59e0b",
    summary: "The state is no longer an 'outside observer' and becomes a triple player: the largest GenAI customer, active regulator, and arena of conflicts.",
    evidence: [
      "DHS (USA) uses Google Veo 3 and Adobe Firefly for public materials",
      "India: 20-year tax holidays for data centers + $4.3B for electronics",
      "Michigan AG seeks review of energy plan for Oracle+OpenAI DC",
      "Google employees demand termination of ICE/CBP contracts",
    ],
    nonObviousConclusion: "A 'triple lock' of regulation is forming: state-as-customer creates standards through procurement; state-as-regulator through laws; employees through internal activism. Compliance becomes a strategic function.",
    educationImplication: "Module on 'AI Governance and Regulatory Landscape': fiscal, export, and compliance regimes as business model determinants. Strategic context for executives in the SKOLKOVO 'AI Transition' program.",
    relevantPrograms: ["aiShift", "ubnd"],
  },
  {
    id: 4,
    title: '"Agent Memory" — the New Frontier',
    subtitle: "Data, Privacy, and Competitive Battle",
    icon: "Brain",
    accentColor: "#8b5cf6",
    summary: "Transition from one-off sessions to agents with long-term memory creates a fundamentally new data class — 'agent operational memory' that merges contexts from different sources.",
    evidence: [
      "Google: Personal Intelligence for Gemini with access to Gmail/Photos/Search",
      "OpenAI: ChatGPT Health with access to medical records (230M health queries/week)",
      "OpenAI Prism: GPT-5.2 embedded in LaTeX editor with access to manuscripts",
      "MIT Tech Review: 'What AI remembers about you is privacy's next frontier'",
    ],
    nonObviousConclusion: "A 'competition for context' emerges: whoever first gains access to the largest data volume through 'agent memory' creates an insurmountable lock-in. Choosing an AI platform = deciding 'who gets our institutional memory'.",
    educationImplication: "Module on 'Data Governance in the Age of Agentic AI': memory segmentation, provenance, context control, deletion policies. Practical data-driven management approach in the 'Business Management with AI and Data' program.",
    relevantPrograms: ["ubnd", "dataDriven"],
  },
  {
    id: 5,
    title: '"The Shadow Economy" of AI',
    subtitle: "Regulation by Payments, Not Laws",
    icon: "ShieldAlert",
    accentColor: "#ef4444",
    summary: "Parallel to the legal market, a 'shadow supply chain' is forming — marketplaces for LoRA instructions, deepfake content. Regulation happens through payment infrastructure, circumvention through cryptocurrency.",
    evidence: [
      "Civitai (backed by a16z): 86% of deepfake requests involve LoRA, 90% of targets are women",
      "Payment processor disconnected Civitai → switch to gift cards and crypto",
      "a16z funds AI super PAC and simultaneously invests in Civitai",
    ],
    nonObviousConclusion: "Visa/Mastercard/PSPs become regulators faster than governments. Two parallel circuits emerge: legal (bank payments + compliance) and shadow (crypto + circumvention).",
    educationImplication: "Understanding 'payment compliance' as a new corporate governance layer for companies working with GenAI. AI marketing risks and opportunities in the SKOLKOVO 'AI in Marketing' program.",
    relevantPrograms: ["aiMarketing", "aiShift"],
  },
  {
    id: 6,
    title: "Vertical Integration 2.0",
    subtitle: "From Conglomerates to 'Full-Stack Stacks'",
    icon: "Layers",
    accentColor: "#f97316",
    summary: "The largest players are building vertical 'stacks' uniting all SRT levels — from physical infrastructure to user interface.",
    evidence: [
      "Musk: SpaceX + xAI + Tesla — from satellite to robot",
      "Amazon: AWS + $50B in OpenAI + Kuiper + Retail",
      "OpenAI: Models + Prism/Health + Frontier — 'OS for knowledge'",
      "Google: Gemini + Cloud + Personal Memory + Genie",
    ],
    nonObviousConclusion: "'Mid-layer' companies face dual pressure: from above (platforms capture margin) and below (infrastructure costs rise). Massive 'mid-layer' consolidation expected in the next 12–18 months.",
    educationImplication: "Module on strategic positioning: value chain analysis, identifying 'nodal positions'. Systematic data-driven transformation approach in the SKOLKOVO 'Data-Driven Management' program.",
    relevantPrograms: ["dataDriven", "ubnd"],
  },
  {
    id: 7,
    title: "Education — the Bottleneck",
    subtitle: "Competencies as the Main Scaling Constraint",
    icon: "GraduationCap",
    accentColor: "#ec4899",
    summary: "The Coursera+Udemy merger, Agent Ops growth, and the shift to boundary-based security point to a critical competency deficit — the main constraint on AI scaling in organizations.",
    evidence: [
      "Coursera + Udemy merger — nodal position for 'mass reskilling'",
      "Growth of 'Agent Ops' as a profession — no standards or training programs yet",
      "Companies shift to 'iconic use case' with ROI and production deployment in ≤3 months",
      "Block, Ocado, Amazon lay off thousands in favor of AI competencies",
    ],
    nonObviousConclusion: "Digital transformation education programs are in a unique strategic position: 'competency supplier' for organizations that cannot hire specialists on the open market. The SKOLKOVO program portfolio covers the full spectrum — from strategy to practice.",
    educationImplication: "Practice-oriented approach: not 'what is AI' but 'how to deploy an agentic system with boundary-control in 3 months'. Full SKOLKOVO program spectrum: from strategic 'AI Transition' to practical 'Generative AI Intensive' and 'AI Product Development Intensive'.",
    relevantPrograms: ["aiShift", "intensiveAI", "intensiveAgents", "ubnd", "aiMarketing", "dataDriven"],
  },
];

export function getStrategicInsights(locale: Locale): StrategicInsight[] {
  return locale === "en" ? INSIGHTS_EN : INSIGHTS_RU;
}

// ── Nodal Positions ─────────────────────────────────────────
const NODAL_EN: NodalPosition[] = [
  {
    id: 1,
    name: "Compute + Energy + DC",
    controllers: "Amazon / Google / Microsoft / Oracle + Nvidia",
    stakes: "Physical foundation of the entire AI economy",
    trend: "Consolidation, CapEx growth",
    trendColor: "#22d3ee",
  },
  {
    id: 2,
    name: "Frontier Models",
    controllers: "OpenAI / Anthropic / Google + DeepSeek / Qwen",
    stakes: "'Intelligence core', but commoditization via open-weight",
    trend: "Bipolarization: closed vs open-weight",
    trendColor: "#10b981",
  },
  {
    id: 3,
    name: "Agentic Platform",
    controllers: "OpenAI (Frontier) / emerging market",
    stakes: "Management, security, agent orchestration",
    trend: "Rapid growth, standard formation",
    trendColor: "#f59e0b",
  },
  {
    id: 4,
    name: "User Context",
    controllers: "Google (Gemini) / OpenAI (Health, Prism) / Apple",
    stakes: "Lock-in through data and habit access",
    trend: "Competition for 'first context'",
    trendColor: "#8b5cf6",
  },
  {
    id: 5,
    name: "Regulatory Layer",
    controllers: "Governments + payment systems + activism",
    stakes: "Market access, operating conditions",
    trend: "Fragmentation, complexity growth",
    trendColor: "#ef4444",
  },
];

export function getNodalPositions(locale: Locale): NodalPosition[] {
  return locale === "en" ? NODAL_EN : NODAL_RU;
}

// ── Education Recommendations ───────────────────────────────
const EDU_EN: EducationRecommendation[] = [
  {
    category: "Update Module Content",
    items: [
      "Infrastructure literacy block (compute, energy, memory as strategic resources)",
      "Practical Agentic AI module (deploying agent systems with governance)",
      "Extended Data Governance block with focus on 'agent memory'",
    ],
    relevantPrograms: ["aiShift", "intensiveAgents", "ubnd"],
  },
  {
    category: "Shift Project Work Focus",
    items: [
      "From 'chatbot pilots' to 'iconic use cases' with measurable ROI (≤3 months to production)",
      "Assignments on value chain analysis and identifying nodal positions",
      "Cases on boundary-based security for agentic systems",
    ],
    relevantPrograms: ["intensiveAI", "intensiveAgents", "dataDriven"],
  },
  {
    category: "Attract Experts from New Domains",
    items: [
      "Agent Ops / AI Security",
      "Computing infrastructure (DC, energy, cooling)",
      "AI regulatory landscape (compliance practitioners, not academic lawyers)",
    ],
    relevantPrograms: ["aiShift", "aiMarketing", "ubnd"],
  },
];

export function getEducationRecommendations(locale: Locale): EducationRecommendation[] {
  return locale === "en" ? EDU_EN : EDU_RU;
}
