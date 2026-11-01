/**
 * Resolve place from news event's place_id (contract from n8n AIwatcher).
 * No keyword heuristics - uses explicit metadata only.
 */

import { SRT_PLACES, type SrtPlace } from './positionRoutes';

export interface NewsPlaceInfo {
  place_id?: string | null;
  place_confidence?: number;
  place_reason?: string;
}

export interface PlaceResolution {
  place: SrtPlace;
  reason?: string;
}

/**
 * Resolve place for news event.
 * Shows section only if:
 * - place_id exists and is known
 * - confidence >= 0.6 (or undefined for old reports)
 */
export function resolvePlace(item: NewsPlaceInfo): PlaceResolution | null {
  if (!item.place_id) return null;
  
  const place = SRT_PLACES[item.place_id];
  if (!place) return null;
  
  if (item.place_confidence !== undefined && item.place_confidence < 0.6) {
    return null;
  }
  
  return {
    place,
    reason: item.place_reason,
  };
}
