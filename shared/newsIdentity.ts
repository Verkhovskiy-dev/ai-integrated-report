export interface NewsIdentityInput {
  title: string;
  description: string;
  sources: string[];
}

function normalize(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function canonicalSource(source: string | undefined) {
  if (!source) return "";
  try {
    const parsed = new URL(source);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return normalize(source);
  }
}

export function stableHash(value: string) {
  let high = 0x811c9dc5;
  let low = 0x01000193;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    high ^= code;
    high = Math.imul(high, 0x01000193) >>> 0;
    low ^= code + index;
    low = Math.imul(low, 0x85ebca6b) >>> 0;
  }
  return high.toString(16).padStart(8, "0") + low.toString(16).padStart(8, "0");
}

export function buildNewsIdentity(input: NewsIdentityInput) {
  const normalizedSources = input.sources.map(canonicalSource).filter(Boolean).sort();
  const stableKey = normalizedSources[0] || `title:${normalize(input.title).toLowerCase()}`;
  const versionMaterial = JSON.stringify({
    title: normalize(input.title),
    description: normalize(input.description),
    sources: normalizedSources,
  });
  return {
    newsId: `news_${stableHash(stableKey)}`,
    contentVersion: `cv_${stableHash(versionMaterial)}`,
    sourceUrl: normalizedSources[0] || undefined,
  };
}
