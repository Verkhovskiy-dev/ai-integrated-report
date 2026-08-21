export interface SignalPositionLink {
  source: 1 | 2 | 3 | 4 | 5;
  positionName: { ru: string; en: string };
  relationship: { ru: string; en: string };
}

const POSITION_RULES: Array<SignalPositionLink & { pattern: RegExp }> = [
  {
    source: 5,
    pattern: /regulat|legal|law|copyright|заимствован|прав|лиценз|государ|payment|санкц|watermark/i,
    positionName: { ru: "Регуляторный слой", en: "Regulatory layer" },
    relationship: { ru: "меняет правила доступа, ответственности и защиты", en: "changes access, liability, and protection rules" },
  },
  {
    source: 3,
    pattern: /agent|агент|orchestrat|tool use|автоном/i,
    positionName: { ru: "Агентная платформа", en: "Agentic platform" },
    relationship: { ru: "создаёт спрос на управление и оркестрацию агентов", en: "creates demand for agent management and orchestration" },
  },
  {
    source: 1,
    pattern: /gpu|chip|чип|compute|вычисл|energy|энерг|data.?cent|дата.?центр|capex|hbm|инфраструктур/i,
    positionName: { ru: "Compute + энергия + ДЦ", en: "Compute + energy + DC" },
    relationship: { ru: "влияет на стоимость и доступность вычислений", en: "affects compute cost and availability" },
  },
  {
    source: 4,
    pattern: /memory|памят|context|контекст|personal|персональ|privacy|приват|данн/i,
    positionName: { ru: "Пользовательский контекст", en: "User context" },
    relationship: { ru: "усиливает ценность данных, памяти и пользовательского контекста", en: "increases the value of data, memory, and user context" },
  },
  {
    source: 2,
    pattern: /model|модел|llm|open.?weight|benchmark|distill|deepseek|anthropic|openai/i,
    positionName: { ru: "Frontier-модели", en: "Frontier models" },
    relationship: { ru: "меняет конкуренцию и способы защиты модельного слоя", en: "changes competition and protection of the model layer" },
  },
];

const FALLBACK: SignalPositionLink = {
  source: 3,
  positionName: { ru: "Агентная платформа", en: "Agentic platform" },
  relationship: { ru: "может изменить способы исполнения работы", en: "may change how work is executed" },
};

export function linkSignalToPosition(title: string, description = ""): SignalPositionLink {
  const content = `${title} ${description}`;
  return POSITION_RULES.find((rule) => rule.pattern.test(content)) ?? FALLBACK;
}

export function buildSignalPositionHref(link: SignalPositionLink, signalId: string) {
  const params = new URLSearchParams({
    source: String(link.source),
    step: "map",
    from: "signal",
    signal: signalId,
  });
  return `/positions?${params.toString()}`;
}
