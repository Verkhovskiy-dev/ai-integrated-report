export type ShareLocale = "ru" | "en";

export function buildShareId(prefix: string, key: string | number) {
  const normalized = String(key).toLowerCase().normalize("NFKD").replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42);
  let hash = 2166136261;
  for (const char of String(key)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${prefix}-${normalized || "item"}-${(hash >>> 0).toString(36)}`;
}

export function buildShareUrl(id: string, locale: ShareLocale, currentHref: string) {
  const url = new URL(currentHref);
  if (id.startsWith("news-")) return `${url.origin}/share/news/${encodeURIComponent(id)}/`;
  url.searchParams.set("share", id);
  url.searchParams.set("lang", locale);
  url.hash = id;
  return url.toString();
}

export function buildTelegramShareUrl(url: string, title: string) {
  const params = new URLSearchParams({ url, text: title });
  return `https://t.me/share/url?${params.toString()}`;
}

export function buildFacebookShareUrl(url: string) {
  const params = new URLSearchParams({ u: url });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}
