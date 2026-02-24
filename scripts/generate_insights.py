#!/usr/bin/env python3
"""
Generate strategic insights from the latest report using OpenAI API.
Produces insights.json for the dashboard.
Also generates insights.en.json (English version).
"""
import json
import os
import sys
from datetime import datetime
from openai import OpenAI

def generate_insights(report_path: str, output_path: str, output_en_path: str):
    client = OpenAI()
    
    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    
    # Build context from report
    events_text = ""
    for level in report.get("srt_levels", []):
        events_text += f"\n### СРТ Уровень {level['level']}: {level['name']}\n"
        for event in level.get("events", []):
            events_text += f"- {event['title']}: {event['description']}\n"
    
    shifts_text = ""
    for shift in report.get("structural_shifts", []):
        shifts_text += f"- {shift['title']}: от «{shift.get('from','')}» к «{shift.get('to','')}» через «{shift.get('through','')}»\n"
    
    signals_text = ""
    for signal in report.get("radar_signals", []):
        signals_text += f"- {signal['title']}: {signal['description']}\n"
    
    prompt = f"""Проанализируй данные AI-отчёта за {report.get('date', 'сегодня')} и сгенерируй 7 стратегических инсайтов.

ДАННЫЕ ОТЧЁТА:
{events_text}

СТРУКТУРНЫЕ СДВИГИ:
{shifts_text}

СЛАБЫЕ СИГНАЛЫ:
{signals_text}

Для каждого инсайта верни JSON объект со следующими полями:
- id: порядковый номер (1-7)
- title: краткий яркий заголовок в кавычках (например: «Великое перемещение стоимости»)
- subtitle: подзаголовок в 3-5 слов
- icon: одна из иконок: Building, Bot, Landmark, Brain, ShieldAlert, Layers, Globe, Shield, TrendingUp, Database
- accentColor: один из цветов: #22d3ee, #f59e0b, #ec4899, #10b981, #8b5cf6, #ef4444, #06b6d4
- summary: развёрнутое описание инсайта (2-3 предложения)
- evidence: массив из 3-5 конкретных фактов/цифр из отчёта
- nonObviousConclusion: неочевидный вывод (2-3 предложения)
- educationImplication: образовательные импликации для СКОЛКОВО (1-2 предложения)
- relevantPrograms: массив ключей программ из списка: aiShift, intensiveAI, intensiveAgents, dataDriven, ubnd, aiMarketing

Верни ТОЛЬКО валидный JSON массив из 7 объектов, без markdown-обёрток."""

    print("Generating insights (RU)...")
    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "Ты — аналитик стратегической разведки в области AI. Генерируй глубокие, неочевидные инсайты на основе данных. Отвечай ТОЛЬКО валидным JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=8000,
    )
    
    raw = resp.choices[0].message.content.strip()
    # Remove markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[:-3]
    
    insights = json.loads(raw)
    
    result = {
        "period": report.get("date", ""),
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "insights": insights
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✓ {len(insights)} insights saved to {output_path}")
    
    # Now generate English version
    print("Translating insights to English...")
    translate_prompt = f"""Translate the following JSON array of strategic insights from Russian to English. 
Keep the JSON structure exactly the same. Translate all text fields (title, subtitle, summary, evidence items, nonObviousConclusion, educationImplication).
Keep field names, numbers, company names, and program keys (like aiShift, intensiveAI etc) unchanged.
Return ONLY valid JSON array.

{json.dumps(insights, ensure_ascii=False)}"""

    resp_en = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You are a professional translator. Return ONLY valid JSON."},
            {"role": "user", "content": translate_prompt}
        ],
        temperature=0.1,
        max_tokens=8000,
    )
    
    raw_en = resp_en.choices[0].message.content.strip()
    if raw_en.startswith("```"):
        raw_en = raw_en.split("\n", 1)[1]
        if raw_en.endswith("```"):
            raw_en = raw_en[:-3]
    
    insights_en = json.loads(raw_en)
    
    result_en = {
        "period": report.get("date", ""),
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "insights": insights_en
    }
    
    with open(output_en_path, "w", encoding="utf-8") as f:
        json.dump(result_en, f, ensure_ascii=False, indent=2)
    
    print(f"✓ {len(insights_en)} EN insights saved to {output_en_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    report_path = os.path.join(base_dir, "client", "public", "data", "latest-report.json")
    output_path = os.path.join(base_dir, "client", "public", "data", "insights.json")
    output_en_path = os.path.join(base_dir, "client", "public", "data", "insights.en.json")
    
    generate_insights(report_path, output_path, output_en_path)
