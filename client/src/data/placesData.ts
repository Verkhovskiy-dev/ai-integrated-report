/**
 * Load places data from places_data.json.
 * This is the full 49-place map used by the /positions page.
 */

export interface Place {
  id: string;
  srt_level: number;
  name: string;
  description: string;
  [key: string]: any;
}

export interface PlacesData {
  places: Place[];
}

let cachedPlaces: Place[] | null = null;

/**
 * Load places data. Caches after first load.
 */
export async function loadPlaces(): Promise<Place[]> {
  if (cachedPlaces) return cachedPlaces;
  
  try {
    const response = await fetch('/data/places_data.json');
    if (!response.ok) {
      console.warn('Failed to load places_data.json, using empty list');
      return [];
    }
    const data: PlacesData = await response.json();
    cachedPlaces = data.places || [];
    return cachedPlaces;
  } catch (error) {
    console.warn('Error loading places_data.json:', error);
    return [];
  }
}

/**
 * Get places as a Map indexed by id for fast lookup.
 */
export async function getPlacesMap(): Promise<Map<string, Place>> {
  const places = await loadPlaces();
  return new Map(places.map(p => [p.id, p]));
}
