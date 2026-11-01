import { describe, it, expect } from 'vitest';
import { resolvePlace } from './newsPlaceMapping';
import type { Place } from './placesData';

// Fixture shaped like places_data.json
const mockPlaces: Place[] = [
  {
    id: 'srt6-structural-verification-services',
    srt_level: 6,
    name: 'Сервисы структурной верификации AI-агентов',
    description: 'Test description',
  },
  {
    id: 'srt8-ethical-dc-development',
    srt_level: 8,
    name: 'Этичная разработка дата-центров',
    description: 'Test description',
  },
];

const placesMap = new Map(mockPlaces.map(p => [p.id, p]));

describe('resolvePlace', () => {
  it('returns place when place_id is valid and confidence is high', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.8,
      place_reason: 'Test reason',
    }, placesMap);
    
    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-structural-verification-services');
    expect(result?.place.srt_level).toBe(6);
    expect(result?.reason).toBe('Test reason');
  });
  
  it('returns place when confidence is exactly 0.6', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.6,
    }, placesMap);
    
    expect(result).not.toBeNull();
  });
  
  it('returns place when confidence is undefined (old reports)', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: undefined,
    }, placesMap);
    
    expect(result).not.toBeNull();
  });
  
  it('returns null when confidence is below 0.6', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.5,
    }, placesMap);
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is null', () => {
    const result = resolvePlace({
      place_id: null,
      place_confidence: 0.9,
    }, placesMap);
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is undefined', () => {
    const result = resolvePlace({
      place_id: undefined,
      place_confidence: 0.9,
    }, placesMap);
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is unknown', () => {
    const result = resolvePlace({
      place_id: 'unknown-place-id',
      place_confidence: 0.9,
    }, placesMap);
    
    expect(result).toBeNull();
  });
  
  it('works with different place from fixture', () => {
    const result = resolvePlace({
      place_id: 'srt8-ethical-dc-development',
      place_confidence: 0.78,
      place_reason: 'NAACP data center case',
    }, placesMap);
    
    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt8-ethical-dc-development');
    expect(result?.place.srt_level).toBe(8);
  });
});
