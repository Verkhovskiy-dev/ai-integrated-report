/**
 * Resolve place from news event's place_id (contract from n8n AIwatcher).
 * Uses full places_data.json (49 places), not the limited SRT_PLACES.
 */

import type { Place } from './placesData';

export interface NewsPlaceInfo {
  place_id?: string | null;
  place_confidence?: number;
  place_reason?: string;
}

export interface PlaceResolution {
  place: Place;
  reason?: string;
}

/**
 * Resolve place for news event.
 * Takes places map from places_data.json.
 * Shows section only if:
 * - place_id exists and is known
 * - confidence >= 0.6 (or undefined for old reports)
 */
export function resolvePlace(
  event: NewsPlaceInfo,
  placesMap: Map<string, Place>
): PlaceResolution | null {
  if (!event.place_id) return null;
  
  const place = placesMap.get(event.place_id);
  if (!place) return null;
  
  if (event.place_confidence !== undefined && event.place_confidence < 0.6) {
    return null;
  }
  
  return {
    place,
    reason: event.place_reason,
  };
}
