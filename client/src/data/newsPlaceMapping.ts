import { SRT_PLACES, type SrtPlace } from './positionRoutes';

/**
 * Maps a news item to its corresponding SRT place.
 * Returns the place object and whether it's an exact match or level-only fallback.
 */
export interface NewsPlaceMapping {
  place: SrtPlace;
  placeId: string;
  isExactMatch: boolean;
}

/**
 * Keyword patterns for specific places within each level.
 * Used for deterministic matching when no explicit place_id is present.
 */
const PLACE_KEYWORDS: Record<string, string[]> = {
  'srt6-structural-verification-services': [
    'верифика', 'аудит', 'оценщ', 'контрол', 'проверк',
    'безопасн', 'риск', 'агент', 'автоном',
    'verification', 'audit', 'safety', 'risk', 'agent'
  ],
  'srt6-sovereign-data-vaults': [
    'данн', 'памят', 'хранен', 'суверен', 'локализац',
    'data', 'memory', 'storage', 'sovereign', 'vault'
  ],
  'srt3-ai-agent-orchestration': [
    'оркестр', 'координац', 'флот', 'миграц', 'процесс',
    'orchestrat', 'coordinat', 'fleet', 'migrat', 'workflow'
  ],
  'srt3-pro-retail-fintech': [
    'финанс', 'трейд', 'инвести', 'рынок', 'торг',
    'finance', 'trad', 'invest', 'market', 'retail'
  ],
  'srt3-ai-native-engineering-edu': [
    'образован', 'обучен', 'переподготовк', 'инженер', 'разработчик',
    'educat', 'train', 'engineer', 'developer', 'skill'
  ],
  'srt8-ai-verification-infra': [
    'инфраструктур', 'верифика', 'фактчек', 'проверк', 'код',
    'infrastructur', 'verificat', 'factcheck', 'code', 'audit'
  ],
  'srt5-ai-data-qa-governance': [
    'качеств', 'qa', 'governance', 'управлен', 'комплаенс',
    'quality', 'complianc', 'governanc', 'regulat'
  ],
  'srt7-ip-royalty-clearinghouse': [
    'данн', 'доступ', 'роялти', 'ip', 'интеллектуальн',
    'data', 'access', 'royalt', 'intellectual', 'gateway'
  ],
  'srt3-decentralized-ip-verification': [
    'контент', 'верифика', 'ip', 'провенанс', 'подлинн',
    'content', 'verificat', 'provenанc', 'authenticit'
  ],
  'srt7-ai-labeling-compliance': [
    'маркировк', 'лейбл', 'провенанс', 'контент', 'метадат',
    'label', 'provenанc', 'content', 'metadata', 'marking'
  ],
};

/**
 * Scores how well a text matches keywords for a specific place.
 */
function scoreMatch(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw)).length;
}

/**
 * Maps a news item to its SRT place.
 * 
 * Algorithm:
 * 1. If item has explicit place_id, use it
 * 2. Otherwise, find all places at this level
 * 3. Score each place by keyword match in title + description
 * 4. Return best match if confident (score > 0), otherwise level-only fallback
 */
export function mapNewsToPlace(item: {
  level: number;
  title: string;
  description: string;
  place_id?: string;
}): NewsPlaceMapping | null {
  // Explicit place_id takes precedence
  if (item.place_id && SRT_PLACES[item.place_id]) {
    const place = SRT_PLACES[item.place_id];
    return {
      place,
      placeId: item.place_id,
      isExactMatch: true,
    };
  }

  // Find all places at this level
  const levelPlaces = Object.entries(SRT_PLACES)
    .filter(([key, place]) => place.level === item.level && key.startsWith('srt'))
    .map(([key, place]) => ({ key, place }));

  if (levelPlaces.length === 0) {
    // Fallback: use level number as place ID
    const fallbackKey = String(item.level);
    const fallbackPlace = SRT_PLACES[fallbackKey];
    if (!fallbackPlace) return null;

    return {
      place: fallbackPlace,
      placeId: fallbackKey,
      isExactMatch: false,
    };
  }

  // If only one place at this level, use it
  if (levelPlaces.length === 1) {
    return {
      place: levelPlaces[0].place,
      placeId: levelPlaces[0].key,
      isExactMatch: true,
    };
  }

  // Score each place by keyword match
  const searchText = `${item.title} ${item.description}`;
  const scored = levelPlaces.map(({ key, place }) => {
    const keywords = PLACE_KEYWORDS[key] || [];
    const score = scoreMatch(searchText, keywords);
    return { key, place, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  
  // If best match has some keywords, use it as exact match
  if (best.score > 0) {
    return {
      place: best.place,
      placeId: best.key,
      isExactMatch: true,
    };
  }

  // Otherwise, fall back to level-only (use first place for that level)
  return {
    place: best.place,
    placeId: String(item.level),
    isExactMatch: false,
  };
}
