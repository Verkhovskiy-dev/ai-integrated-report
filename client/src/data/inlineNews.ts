import type { ExecutiveLookup } from './newsContract';

/** Presentation only: never change source URLs used by news/reaction identity. */
export function visibleNewsSources(value: unknown): Array<{ url: string; host: string }> {
  const result: Array<{ url: string; host: string }> = [];
  const seen = new Set<string>();
  for (const raw of Array.isArray(value) ? value : []) {
    if (typeof raw !== 'string') continue;
    try {
      const url = new URL(raw.trim());
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) continue;
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      result.push({ url: url.href, host: url.hostname.replace(/^www\./, '') });
    } catch { /* An absent link stays absent; do not invent a destination. */ }
  }
  return result;
}

/** Only the version-validated executive lookup may supply an interpretation. */
export function inlineWhy(lookup: ExecutiveLookup, loading: boolean, isEn: boolean) {
  if (lookup.status === 'available' && lookup.explanation.why_important?.trim()) {
    return { available: true, text: lookup.explanation.why_important.trim() };
  }
  return {
    available: false,
    text: loading
      ? (isEn ? 'Loading the explanation…' : 'Пояснение загружается…')
      : (isEn ? 'A verified explanation is not available for this news version.' : 'Проверенное пояснение для этой версии новости пока недоступно.'),
  };
}
