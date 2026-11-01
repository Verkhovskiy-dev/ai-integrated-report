import { describe, test, expect } from 'vitest';
import { mapNewsToPlace } from './newsPlaceMapping';

describe('newsPlaceMapping', () => {
  test('maps level 6 verification news to structural-verification place', () => {
    const result = mapNewsToPlace({
      level: 6,
      title: 'Anthropic и OpenAI хотят встроить внешних оценщиков',
      description: 'Компании разрабатывают системы верификации и аудита для автономных агентов',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(6);
    expect(result?.placeId).toBe('srt6-structural-verification-services');
    expect(result?.isExactMatch).toBe(true);
  });

  test('maps level 6 memory news to sovereign-data-vaults place', () => {
    const result = mapNewsToPlace({
      level: 6,
      title: 'Новые требования к хранению данных агентов',
      description: 'Локализация и контроль памяти становятся критичными',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(6);
    expect(result?.placeId).toBe('srt6-sovereign-data-vaults');
    expect(result?.isExactMatch).toBe(true);
  });

  test('maps level 3 orchestration news to ai-agent-orchestration place', () => {
    const result = mapNewsToPlace({
      level: 3,
      title: 'Оркестрация флотов AI-агентов становится стандартом',
      description: 'Компании переходят от единичных агентов к координированным флотам',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(3);
    expect(result?.placeId).toBe('srt3-ai-agent-orchestration');
    expect(result?.isExactMatch).toBe(true);
  });

  test('maps level 3 finance news to pro-retail-fintech place', () => {
    const result = mapNewsToPlace({
      level: 3,
      title: 'AI-инструменты для розничных трейдеров',
      description: 'Демократизация финансовой аналитики через AI',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(3);
    expect(result?.placeId).toBe('srt3-pro-retail-fintech');
    expect(result?.isExactMatch).toBe(true);
  });

  test('uses explicit place_id when provided', () => {
    const result = mapNewsToPlace({
      level: 3,
      title: 'Some generic title',
      description: 'Generic description',
      place_id: 'srt3-ai-native-engineering-edu',
    });

    expect(result).not.toBeNull();
    expect(result?.placeId).toBe('srt3-ai-native-engineering-edu');
    expect(result?.isExactMatch).toBe(true);
  });

  test('falls back to level-only when no keywords match', () => {
    const result = mapNewsToPlace({
      level: 3,
      title: 'Something completely unrelated',
      description: 'No matching keywords at all',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(3);
    // Should use level-only fallback
    expect(result?.isExactMatch).toBe(false);
  });

  test('handles level 8 verification infrastructure news', () => {
    const result = mapNewsToPlace({
      level: 8,
      title: 'Инфраструктура верификации AI-кода',
      description: 'Независимая проверка безопасности сгенерированного кода',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(8);
    expect(result?.placeId).toBe('srt8-ai-verification-infra');
    expect(result?.isExactMatch).toBe(true);
  });

  test('handles level 5 news with keyword matching', () => {
    const result = mapNewsToPlace({
      level: 5,
      title: 'AI Data Quality and Governance',
      description: 'New compliance requirements for AI data quality',
    });

    expect(result).not.toBeNull();
    expect(result?.place.level).toBe(5);
    expect(result?.placeId).toBe('srt5-ai-data-qa-governance');
    expect(result?.isExactMatch).toBe(true);
  });
});
