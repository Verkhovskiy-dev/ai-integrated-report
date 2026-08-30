export type ShareLocale = "ru" | "en";

export function buildShareUrl(id: string, locale: ShareLocale, currentHref: string) {
  const url = new URL(currentHref);
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
