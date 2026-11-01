import { describe, it, expect } from 'vitest';
import { resolvePlace } from './newsPlaceMapping';

describe('resolvePlace', () => {
  it('returns place when place_id is valid and confidence is high', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.8,
      place_reason: 'Test reason',
    });
    
    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-structural-verification-services');
    expect(result?.place.level).toBe(6);
    expect(result?.reason).toBe('Test reason');
  });
  
  it('returns place when confidence is exactly 0.6', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.6,
    });
    
    expect(result).not.toBeNull();
  });
  
  it('returns place when confidence is undefined (old reports)', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: undefined,
    });
    
    expect(result).not.toBeNull();
  });
  
  it('returns null when confidence is below 0.6', () => {
    const result = resolvePlace({
      place_id: 'srt6-structural-verification-services',
      place_confidence: 0.5,
    });
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is null', () => {
    const result = resolvePlace({
      place_id: null,
      place_confidence: 0.9,
    });
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is undefined', () => {
    const result = resolvePlace({
      place_id: undefined,
      place_confidence: 0.9,
    });
    
    expect(result).toBeNull();
  });
  
  it('returns null when place_id is unknown', () => {
    const result = resolvePlace({
      place_id: 'unknown-place-id',
      place_confidence: 0.9,
    });
    
    expect(result).toBeNull();
  });
});
