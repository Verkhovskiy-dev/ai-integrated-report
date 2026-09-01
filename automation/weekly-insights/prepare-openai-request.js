// n8n Code node: request a single versioned package instead of disconnected insights/advice.
const input = $input.first().json;
if (!input.combined_archive || input.combined_archive.length < 1000) {
  throw new Error(`Grounded archive is empty or too short: ${input.combined_archive?.length || 0}`);
}

const systemPrompt = `Ты — редактор стратегического аналитического продукта Verkhovskiy.ai.
На входе — 14 ежедневных отчётов СРТ. Каждое событие имеет уникальный eventId, факт, объяснение значимости и URL источника.

Сформируй 5–7 стратегических инсайтов. Не используй знания, которых нет во входе. Любое доказательство должно ссылаться на eventId из входа. Не повторяй одну тему разными словами.

Верни только JSON:
{
  "insights": [{
    "insightKey": "устойчивый-latin-kebab-key",
    "title": "3–7 слов",
    "subtitle": "5–12 слов",
    "icon": "Building|Bot|Landmark|Brain|ShieldAlert|Layers|GraduationCap|Zap|Globe|Shield|TrendingUp|Database",
    "accentColor": "#22d3ee|#10b981|#f59e0b|#8b5cf6|#ef4444|#f97316|#ec4899",
    "summary": "2–3 предложения: что изменилось и почему это важно",
    "evidence": ["3–5 коротких проверяемых фактов"],
    "evidenceSourceIds": ["3–5 eventId из входа"],
    "nonObviousConclusion": "вывод, следующий из совокупности фактов",
    "educationImplication": "какую компетенцию нужно развивать",
    "relevantPrograms": ["aiShift|intensiveAI|intensiveAgents|dataDriven|ubnd|aiMarketing"],
    "srtLevels": [1,2,3],
    "trendDirection": "strengthening|weakening|emerging|stable",
    "roleRecommendations": {
      "entrepreneur": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "ceo": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "manager": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "cto": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "product": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "hr": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60},
      "cdo": {"relevance": 0, "action": "конкретное действие", "expectedArtifact": "артефакт", "estimatedMinutes": 60}
    },
    "ekenBrief": {
      "objective": "какое решение или изменение получить",
      "firstAction": "первое действие на реальном объекте",
      "expectedArtifact": "проверяемый результат",
      "acceptanceCriterion": "как понять, что результат принят",
      "estimatedMinutes": 60
    }
  }]
}

Требования:
- evidenceSourceIds должны существовать во входе; минимум 3 разных события и минимум 2 даты на инсайт.
- relevance — целое число 0–100, отражающее реальную, а не словарную релевантность.
- action начинается с глагола и может быть выполнено конкретной ролью.
- Eken-бриф должен вести к первому продуктивному действию, а не к чтению или обсуждению.
- Не присваивай числовые id: их добавит валидатор.`;

return [{
  json: {
    requestBody: {
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Период: ${input.date_range}. Отчётов: ${input.report_count}. Проверяемых событий: ${input.source_count}.\n\n${input.combined_archive}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 12000,
    },
  },
}];
