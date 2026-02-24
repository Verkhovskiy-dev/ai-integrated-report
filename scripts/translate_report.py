#!/usr/bin/env python3
"""
Translate latest-report.json from Russian to English using OpenAI API.
Produces latest-report.en.json alongside the original.
"""
import json
import os
import sys
from openai import OpenAI

def translate_text(client, text: str) -> str:
    """Translate a single Russian text to English."""
    if not text or not text.strip():
        return text
    # Skip if already English (simple heuristic)
    russian_chars = sum(1 for c in text if '\u0400' <= c <= '\u04FF')
    if russian_chars < len(text) * 0.1:
        return text
    
    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You are a professional translator. Translate the following Russian text to English. Keep technical terms, company names, and abbreviations as-is. Return ONLY the translation, nothing else."},
            {"role": "user", "content": text}
        ],
        temperature=0.1,
        max_tokens=2000,
    )
    return resp.choices[0].message.content.strip()

def translate_batch(client, texts: list[str]) -> list[str]:
    """Translate multiple texts in one API call for efficiency."""
    if not texts:
        return []
    
    # Filter out empty texts
    non_empty = [(i, t) for i, t in enumerate(texts) if t and t.strip()]
    if not non_empty:
        return texts
    
    # Batch translate using numbered format
    numbered = "\n".join(f"[{i}] {t}" for i, t in non_empty)
    
    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You are a professional translator. Translate each numbered Russian text to English. Keep technical terms, company names, and abbreviations as-is. Return translations in the same numbered format [N] translation. Return ONLY the translations."},
            {"role": "user", "content": numbered}
        ],
        temperature=0.1,
        max_tokens=8000,
    )
    
    result_text = resp.choices[0].message.content.strip()
    
    # Parse results
    translations = {}
    for line in result_text.split("\n"):
        line = line.strip()
        if line.startswith("["):
            bracket_end = line.index("]")
            idx = int(line[1:bracket_end])
            translations[idx] = line[bracket_end+1:].strip()
    
    # Build result
    result = list(texts)
    for i, _ in non_empty:
        if i in translations:
            result[i] = translations[i]
    
    return result

def translate_report(input_path: str, output_path: str):
    client = OpenAI()
    
    with open(input_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    
    print(f"Translating report dated {report.get('date', 'unknown')}...")
    
    # Translate key_focus
    if report.get("key_focus"):
        report["key_focus"] = translate_text(client, report["key_focus"])
        print("  ✓ key_focus")
    
    # Translate srt_levels
    for level in report.get("srt_levels", []):
        if level.get("name"):
            level["name"] = translate_text(client, level["name"])
        
        # Batch translate events for this level
        events = level.get("events", [])
        if events:
            titles = [e.get("title", "") for e in events]
            descs = [e.get("description", "") for e in events]
            
            translated_titles = translate_batch(client, titles)
            translated_descs = translate_batch(client, descs)
            
            for i, event in enumerate(events):
                event["title"] = translated_titles[i]
                event["description"] = translated_descs[i]
        
        print(f"  ✓ SRT level {level.get('level', '?')}: {level['name']}")
    
    # Translate flat events array if present
    flat_events = report.get("events", [])
    if flat_events:
        titles = [e.get("title", "") for e in flat_events]
        descs = [e.get("description", "") for e in flat_events]
        translated_titles = translate_batch(client, titles)
        translated_descs = translate_batch(client, descs)
        for i, event in enumerate(flat_events):
            event["title"] = translated_titles[i]
            event["description"] = translated_descs[i]
        print(f"  ✓ {len(flat_events)} flat events")
    
    # Translate flat trends array if present
    flat_trends = report.get("trends", [])
    if flat_trends:
        names = [t.get("name", "") for t in flat_trends]
        rationales = [t.get("rationale", "") for t in flat_trends]
        translated_names = translate_batch(client, names)
        translated_rationales = translate_batch(client, rationales)
        for i, trend in enumerate(flat_trends):
            trend["name"] = translated_names[i]
            trend["rationale"] = translated_rationales[i]
        print(f"  ✓ {len(flat_trends)} flat trends")
    
    # Translate structural_shifts
    for shift in report.get("structural_shifts", []):
        fields = ["title", "from", "to", "through", "trend"]
        texts = [shift.get(f, "") for f in fields]
        translated = translate_batch(client, texts)
        for f, t in zip(fields, translated):
            shift[f] = t
    if report.get("structural_shifts"):
        print(f"  ✓ {len(report['structural_shifts'])} structural shifts")
    
    # Translate radar_signals
    for signal in report.get("radar_signals", []):
        if signal.get("title"):
            signal["title"] = translate_text(client, signal["title"])
        if signal.get("description"):
            signal["description"] = translate_text(client, signal["description"])
    if report.get("radar_signals"):
        print(f"  ✓ {len(report['radar_signals'])} radar signals")
    
    # Translate cross_level_links
    for link in report.get("cross_level_links", []):
        if link.get("title"):
            link["title"] = translate_text(client, link["title"])
        if link.get("description"):
            link["description"] = translate_text(client, link["description"])
    if report.get("cross_level_links"):
        print(f"  ✓ {len(report['cross_level_links'])} cross-level links")
    
    # Translate momentum_trends
    for trend in report.get("momentum_trends", []):
        if trend.get("name"):
            trend["name"] = translate_text(client, trend["name"])
        if trend.get("rationale"):
            trend["rationale"] = translate_text(client, trend["rationale"])
    if report.get("momentum_trends"):
        print(f"  ✓ {len(report['momentum_trends'])} momentum trends")
    
    # Translate categories
    if report.get("categories"):
        translated_cats = {}
        for cat_name, cat_data in report["categories"].items():
            new_name = translate_text(client, cat_name)
            translated_cats[new_name] = cat_data
        report["categories"] = translated_cats
        print(f"  ✓ categories")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Translated report saved to {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, "client", "public", "data", "latest-report.json")
    output_path = os.path.join(base_dir, "client", "public", "data", "latest-report.en.json")
    
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    
    translate_report(input_path, output_path)
