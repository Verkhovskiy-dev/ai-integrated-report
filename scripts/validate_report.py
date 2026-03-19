#!/usr/bin/env python3
"""
Validate latest-report.json to ensure data quality.
Checks:
  1. All events in srt_levels have non-empty 'sources' field
  2. Sources are valid URLs
  3. Report date is recent (not older than 7 days)

Usage:
  python3 scripts/validate_report.py [path/to/latest-report.json]

Exit codes:
  0 — validation passed (or passed with warnings)
  1 — validation failed (critical errors)
"""
import json
import os
import sys
import re
from datetime import datetime, timezone, timedelta

# ─── Configuration ────────────────────────────────────────────────────────────
# Minimum fraction of events that must have at least one source URL.
# Set to 0.5 = at least 50% of events must have sources.
MIN_SOURCES_FRACTION = 0.5

# Maximum age of the report in days before a warning is raised.
MAX_REPORT_AGE_DAYS = 7

# Regex for a basic URL check
URL_PATTERN = re.compile(r'^https?://.+\..+', re.IGNORECASE)
# ──────────────────────────────────────────────────────────────────────────────


def validate(report_path: str) -> tuple[bool, list[str], list[str]]:
    """
    Validate the report JSON file.

    Returns:
        (ok, errors, warnings)
        ok       — True if no critical errors were found
        errors   — list of critical error messages
        warnings — list of non-critical warning messages
    """
    errors: list[str] = []
    warnings: list[str] = []

    # ── Load file ──────────────────────────────────────────────────────────────
    if not os.path.exists(report_path):
        errors.append(f"File not found: {report_path}")
        return False, errors, warnings

    try:
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid JSON: {exc}")
        return False, errors, warnings

    # ── Date check ─────────────────────────────────────────────────────────────
    report_date_str = report.get("date", "")
    if report_date_str:
        try:
            report_date = datetime.strptime(report_date_str, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
            age = datetime.now(timezone.utc) - report_date
            if age > timedelta(days=MAX_REPORT_AGE_DAYS):
                warnings.append(
                    f"Report date {report_date_str} is {age.days} days old "
                    f"(threshold: {MAX_REPORT_AGE_DAYS} days)"
                )
        except ValueError:
            warnings.append(f"Cannot parse report date: {report_date_str!r}")
    else:
        warnings.append("Report has no 'date' field")

    # ── Events / sources check ─────────────────────────────────────────────────
    srt_levels = report.get("srt_levels", [])
    if not srt_levels:
        errors.append("No 'srt_levels' found in report")
        return False, errors, warnings

    total_events = 0
    events_with_sources = 0
    events_missing_sources: list[str] = []
    events_bad_urls: list[tuple[str, str]] = []

    for level in srt_levels:
        level_id = level.get("level", "?")
        for event in level.get("events", []):
            total_events += 1
            title = event.get("title", "")[:60]
            sources = event.get("sources")

            # Field missing entirely
            if sources is None:
                events_missing_sources.append(
                    f"  Lv{level_id}: '{title}' — field 'sources' is absent"
                )
                continue

            # Field present but empty
            if not sources:
                events_missing_sources.append(
                    f"  Lv{level_id}: '{title}' — sources: []"
                )
                continue

            # Validate each URL
            events_with_sources += 1
            for url in sources:
                if not URL_PATTERN.match(url):
                    events_bad_urls.append((title, url))

    if total_events == 0:
        errors.append("Report contains no events in srt_levels")
        return False, errors, warnings

    fraction = events_with_sources / total_events
    pct = fraction * 100

    print(f"  Events total:        {total_events}")
    print(f"  Events with sources: {events_with_sources} ({pct:.0f}%)")
    print(f"  Events without:      {total_events - events_with_sources}")

    if fraction < MIN_SOURCES_FRACTION:
        errors.append(
            f"Only {events_with_sources}/{total_events} events ({pct:.0f}%) have source URLs. "
            f"Required minimum: {MIN_SOURCES_FRACTION * 100:.0f}%. "
            f"Events missing sources:\n" + "\n".join(events_missing_sources)
        )
    elif events_missing_sources:
        warnings.append(
            f"{len(events_missing_sources)} event(s) have no sources "
            f"(below threshold but acceptable):\n" + "\n".join(events_missing_sources[:10])
        )

    if events_bad_urls:
        for title, url in events_bad_urls:
            warnings.append(f"  Suspicious URL in '{title}': {url}")

    ok = len(errors) == 0
    return ok, errors, warnings


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    report_path = os.path.join(base_dir, "data", "latest-report.json")

    if len(sys.argv) > 1:
        report_path = sys.argv[1]

    print(f"Validating: {report_path}")
    print("─" * 60)

    ok, errors, warnings = validate(report_path)

    if warnings:
        print("\n⚠  WARNINGS:")
        for w in warnings:
            print(f"  {w}")

    if errors:
        print("\n✗  ERRORS:")
        for e in errors:
            print(f"  {e}")
        print("\n✗  Validation FAILED")
        sys.exit(1)
    else:
        print("\n✓  Validation PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
