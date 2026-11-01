/**
 * Unit tests for news-to-place resolver.
 * Tests all edge cases defined in the contract.
 */

import { describe, it, expect } from 'vitest';
import { resolveNewsPlace } from './newsPlaceMapping';
import type { PlaceData } from './placesRegistry';

// Mock place data for testing
const mockPlace: PlaceData = {
  id: 'srt6-test-place',
  level: 6,
  name: 'Test Place',
  label: 'СРТ-6 · Test Place',
  change: 'Test change',
  whyNow: 'Test why now',
  window: 'Открыто',
  productiveExit: 'Test exit',
  evidence: ['Evidence 1', 'Evidence 2'],
};

const placesMap = new Map([[mockPlace.id, mockPlace]]);

describe('resolveNewsPlace', () => {
  it('returns place when place_id is valid and confidence is high', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_confidence: 0.8,
        place_reason: 'Test reason',
      },
      placesMap
    );

    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-test-place');
    expect(result?.place.level).toBe(6);
    expect(result?.reason).toBe('Test reason');
  });

  it('returns place when place_id is valid and confidence is exactly 0.6', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_confidence: 0.6,
      },
      placesMap
    );

    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-test-place');
  });

  it('returns place when place_id is valid and confidence is undefined', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_confidence: undefined,
        place_reason: 'Confidence missing',
      },
      placesMap
    );

    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-test-place');
    expect(result?.reason).toBe('Confidence missing');
  });

  it('returns place when place_id is valid and confidence field is missing', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_reason: 'Old report format',
      },
      placesMap
    );

    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-test-place');
  });

  it('returns null when confidence is below 0.6', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_confidence: 0.5,
        place_reason: 'Low confidence',
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('returns null when place_id is null', () => {
    const result = resolveNewsPlace(
      {
        place_id: null,
        place_confidence: 0.9,
        place_reason: 'Place is null',
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('returns null when place_id is undefined', () => {
    const result = resolveNewsPlace(
      {
        place_id: undefined,
        place_confidence: 0.9,
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('returns null when place_id is empty string', () => {
    const result = resolveNewsPlace(
      {
        place_id: '',
        place_confidence: 0.9,
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('returns null when place_id is unknown', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt9-unknown-place',
        place_confidence: 0.9,
        place_reason: 'Unknown place',
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('returns place without reason when reason is undefined', () => {
    const result = resolveNewsPlace(
      {
        place_id: 'srt6-test-place',
        place_confidence: 0.8,
        place_reason: undefined,
      },
      placesMap
    );

    expect(result).not.toBeNull();
    expect(result?.place.id).toBe('srt6-test-place');
    expect(result?.reason).toBeUndefined();
  });

  it('handles old report format with all fields undefined', () => {
    const result = resolveNewsPlace(
      {
        place_id: undefined,
        place_confidence: undefined,
        place_reason: undefined,
      },
      placesMap
    );

    expect(result).toBeNull();
  });

  it('ignores high confidence when place_id is null', () => {
    const result = resolveNewsPlace(
      {
        place_id: null,
        place_confidence: 0.95,
        place_reason: 'High confidence but no place',
      },
      placesMap
    );

    expect(result).toBeNull();
  });
});
