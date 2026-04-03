#!/usr/bin/env python3
"""
Validate and sanitize latest-report.json to ensure data quality.

Checks (validation):
  1. All events in srt_levels have non-empty 'sources' field
  2. Sources are valid URLs
  3. Report date is recent (not older than 7 days)
  4. No Markdown artifacts in event titles (---, ##, #)
  5. No duplicate title == description

Auto-fix (with --fix flag):
  - Remove events whose title contains Markdown artifacts (---, ##)
  - Clear description if it duplicates the title
  - Remove exact duplicate events from top-level 'events' array

Usage:
  python3 scripts/validate_report.py [path/to/latest-report.json]
  python3 scripts/validate_report.py [path/to/latest-report.json] --fix

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

# Regex to detect Markdown artifacts in event titles
# Matches titles that start with --- or contain ## headers
MARKDOWN_ARTIFACT_PATTERN = re.compile(r'(^---|\n---|\n##\s|^##\s)')
# ──────────────────────────────────────────────────────────────────────────────


def is_markdown_artifact(title: str) -> bool:
    """Check if a title contains Markdown formatting artifacts."""
    if not title:
        return False
    stripped = title.strip()
    # Starts with --- (horizontal rule)
    if stripped.startswith("---"):
        return True
    # Contains ## header syntax
    if "## " in stripped or stripped.startswith("#"):
        return True
    # Contains \n--- (embedded horizontal rule)
    if "\n---" in stripped:
        return True
    return False


def is_duplicate_description(title: str, description: str) -> bool:
    """Check if description is a trivial duplicate of title."""
    if not title or not description:
        return False
    t = title.strip().rstrip(".")
    d = description.strip().rstrip(".")
    return t == d


def sanitize_report(report: dict) -> tuple[dict, list[str]]:
    """
    Sanitize the report by removing known data quality issues.

    Returns:
        (sanitized_report, fix_log)
        fix_log — list of human-readable descriptions of changes made
    """
    fix_log: list[str] = []

    # ── Fix srt_levels events ─────────────────────────────────────────────────
    for level in report.get("srt_levels", []):
        level_id = level.get("level", "?")
        original_events = level.get("events", [])
        cleaned_events = []

        for event in original_events:
            title = event.get("title", "")

            # Remove Markdown artifacts
            if is_markdown_artifact(title):
                fix_log.append(
                    f"REMOVED Markdown artifact from srt_levels Lv{level_id}: "
                    f"{repr(title[:60])}"
                )
                continue

            # Clear duplicate description
            description = event.get("description", "")
            if is_duplicate_description(title, description):
                event["description"] = ""
                fix_log.append(
                    f"CLEARED duplicate description in srt_levels Lv{level_id}: "
                    f"'{title[:50]}...'"
                )

            cleaned_events.append(event)

        level["events"] = cleaned_events

    # ── Fix top-level events array ────────────────────────────────────────────
    top_events = report.get("events", [])
    if top_events:
        cleaned_top = []
        seen_titles = set()

        for event in top_events:
            title = event.get("title", "")

            # Remove Markdown artifacts
            if is_markdown_artifact(title):
                fix_log.append(
                    f"REMOVED Markdown artifact from top-level events: "
                    f"{repr(title[:60])}"
                )
                continue

            # Remove exact duplicates (same title)
            if title in seen_titles:
                fix_log.append(
                    f"REMOVED duplicate from top-level events: "
                    f"'{title[:50]}...'"
                )
                continue
            seen_titles.add(title)

            # Clear duplicate description
            description = event.get("description", "")
            if is_duplicate_description(title, description):
                event["description"] = ""
                fix_log.append(
                    f"CLEARED duplicate description in top-level events: "
                    f"'{title[:50]}...'"
                )

            cleaned_top.append(event)

        report["events"] = cleaned_top

    return report, fix_log


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
    markdown_artifacts: list[str] = []
    duplicate_descriptions: list[str] = []

    for level in srt_levels:
        level_id = level.get("level", "?")
        for event in level.get("events", []):
            total_events += 1
            title = event.get("title", "")
            description = event.get("description", "")
            sources = event.get("sources")

            # ── Check for Markdown artifacts ──────────────────────────────────
            if is_markdown_artifact(title):
                markdown_artifacts.append(
                    f"  Lv{level_id}: {repr(title[:60])}"
                )

            # ── Check for duplicate description ───────────────────────────────
            if is_duplicate_description(title, description):
                duplicate_descriptions.append(
                    f"  Lv{level_id}: '{title[:60]}'"
                )

            # ── Check sources ─────────────────────────────────────────────────
            title_short = title[:60]

            # Field missing entirely
            if sources is None:
                events_missing_sources.append(
                    f"  Lv{level_id}: '{title_short}' — field 'sources' is absent"
                )
                continue

            # Field present but empty
            if not sources:
                events_missing_sources.append(
                    f"  Lv{level_id}: '{title_short}' — sources: []"
                )
                continue

            # Validate each URL
            events_with_sources += 1
            for url in sources:
                if not URL_PATTERN.match(url):
                    events_bad_urls.append((title_short, url))

    if total_events == 0:
        # Critical: ALL levels are empty — this is a generation bug, not a data issue
        errors.append(
            "CRITICAL: All srt_levels have empty events arrays. "
            "This indicates a bug in the AIwatcher generation script — "
            "the report was generated but events were not populated."
        )
        return False, errors, warnings

    fraction = events_with_sources / total_events
    pct = fraction * 100

    print(f"  Events total:        {total_events}")
    print(f"  Events with sources: {events_with_sources} ({pct:.0f}%)")
    print(f"  Events without:      {total_events - events_with_sources}")

    # ── Report Markdown artifacts ─────────────────────────────────────────────
    if markdown_artifacts:
        errors.append(
            f"Found {len(markdown_artifacts)} event(s) with Markdown artifacts "
            f"in title (---, ##, #). These are formatting remnants, not real events. "
            f"Run with --fix to auto-remove.\n" + "\n".join(markdown_artifacts)
        )

    # ── Report duplicate descriptions ─────────────────────────────────────────
    if duplicate_descriptions:
        warnings.append(
            f"{len(duplicate_descriptions)} event(s) have description identical "
            f"to title (visual duplication in UI). "
            f"Run with --fix to auto-clear.\n"
            + "\n".join(duplicate_descriptions[:10])
            + (f"\n  ... and {len(duplicate_descriptions) - 10} more"
               if len(duplicate_descriptions) > 10 else "")
        )

    # ── Report source coverage ────────────────────────────────────────────────
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
    fix_mode = False

    args = [a for a in sys.argv[1:] if a != "--fix"]
    if "--fix" in sys.argv:
        fix_mode = True

    if args:
        report_path = args[0]

    print(f"Validating: {report_path}")
    if fix_mode:
        print("Mode: VALIDATE + FIX")
    print("─" * 60)

    # ── Run validation first ──────────────────────────────────────────────────
    ok, errors, warnings = validate(report_path)

    if warnings:
        print("\n⚠  WARNINGS:")
        for w in warnings:
            print(f"  {w}")

    if errors:
        print("\n✗  ERRORS:")
        for e in errors:
            print(f"  {e}")

    # ── Auto-fix if requested ─────────────────────────────────────────────────
    if fix_mode:
        print("\n" + "─" * 60)
        print("Applying auto-fixes...")

        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)

        report, fix_log = sanitize_report(report)

        if fix_log:
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)

            print(f"\n✓  Applied {len(fix_log)} fixes:")
            for entry in fix_log:
                print(f"  • {entry}")
            print(f"\n✓  Saved sanitized report to {report_path}")
        else:
            print("\n✓  No fixes needed — report is clean")

        # Re-validate after fix
        print("\n" + "─" * 60)
        print("Re-validating after fix...")
        ok2, errors2, warnings2 = validate(report_path)
        if warnings2:
            print("\n⚠  WARNINGS (post-fix):")
            for w in warnings2:
                print(f"  {w}")
        if errors2:
            print("\n✗  ERRORS (post-fix):")
            for e in errors2:
                print(f"  {e}")
            print("\n✗  Validation FAILED (even after fix)")
            sys.exit(1)
        else:
            print("\n✓  Validation PASSED (after fix)")
            sys.exit(0)

    # ── Exit based on validation result ───────────────────────────────────────
    if errors:
        print("\n✗  Validation FAILED")
        sys.exit(1)
    else:
        print("\n✓  Validation PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
