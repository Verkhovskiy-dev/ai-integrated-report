/**
 * News-to-place resolver using AIwatcher-provided place_id.
 * No heuristics - relies entirely on the data contract from n8n.
 *
 * Contract (from latest-report.json srt_levels[].events[]):
 * - place_id: string id from places registry, or null/undefined
 * - place_confidence: number 0..1, optional (may be >0 even when place_id is null - ignore it then)
 * - place_reason: string, short Russian explanation
 *
 * Rules:
 * - Display level comes from the place itself (place.level), NOT from news item level
 * - Show section ONLY if: place_id exists, place is in registry, confidence >= 0.6 (or undefined)
 * - Unknown place_id -> hide section
 * - Old reports where fields are undefined -> hide section
 */

import type { PlaceData } from './placesRegistry';

export interface NewsPlaceInfo {
  place_id?: string | null;
  place_confidence?: number;
  place_reason?: string;
}

export interface PlaceResolution {
  place: PlaceData;
  reason?: string;
}

/**
 * Resolves a place from the news item's place_id.
 * Returns the place data if:
 * - place_id is present (not null/undefined/empty)
 * - place exists in placesById
 * - confidence is >= 0.6 (or missing/undefined)
 *
 * Otherwise returns null (section will be hidden).
 */
export function resolveNewsPlace(
  item: NewsPlaceInfo,
  placesById: Map<string, PlaceData>
): PlaceResolution | null {
  // No place_id = no section
  if (!item.place_id) {
    return null;
  }

  // Unknown place_id = no section
  const place = placesById.get(item.place_id);
  if (!place) {
    return null;
  }

  // Low confidence = no section (unless confidence is missing/undefined)
  if (item.place_confidence !== undefined && item.place_confidence < 0.6) {
    return null;
  }

  return {
    place,
    reason: item.place_reason,
  };
}
