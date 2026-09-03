import { describe, expect, it, vi } from "vitest";
import { buildFacebookShareUrl, buildShareId, buildShareUrl, buildTelegramShareUrl, isNewsSharePageReady, shouldUseNativeFacebookShare } from "./share";

describe("dashboard sharing", () => {
  it("builds a section URL while preserving existing filters", () => {
    const result = new URL(buildShareUrl("insights", "ru", "https://example.com/?role=ceo#old"));
    expect(result.searchParams.get("role")).toBe("ceo");
    expect(result.searchParams.get("share")).toBe("insights");
    expect(result.searchParams.get("lang")).toBe("ru");
    expect(result.hash).toBe("#insights");
  });

  it("encodes Telegram copy without double encoding", () => {
    const result = new URL(buildTelegramShareUrl("https://example.com/?share=news#news", "Новости AI & тренды"));
    expect(result.searchParams.get("url")).toBe("https://example.com/?share=news#news");
    expect(result.searchParams.get("text")).toBe("Новости AI & тренды");
  });

  it("encodes the Facebook target", () => {
    const result = new URL(buildFacebookShareUrl("https://example.com/?share=signals#signals"));
    expect(result.searchParams.get("u")).toBe("https://example.com/?share=signals#signals");
  });

  it("builds stable, URL-safe item anchors", () => {
    expect(buildShareId("news", "Новый AI-агент: запуск!")).toBe(buildShareId("news", "Новый AI-агент: запуск!"));
    expect(buildShareId("news", "Новый AI-агент: запуск!")).toMatch(/^news-[a-zа-яё0-9-]+-[a-z0-9]+$/i);
  });

  it("uses a dedicated static page for a news item", () => {
    expect(buildShareUrl("news-example-abc", "ru", "https://verkhovskiy.ai/?view=executive"))
      .toBe("https://verkhovskiy.ai/share/v3/news/abc/");
  });

  it("uses the native share sheet for Facebook on iPhone and touch iPad", () => {
    expect(shouldUseNativeFacebookShare(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      "iPhone",
      5,
    )).toBe(true);
    expect(shouldUseNativeFacebookShare("Mozilla/5.0 (Macintosh)", "MacIntel", 5)).toBe(true);
    expect(shouldUseNativeFacebookShare("Mozilla/5.0 (Macintosh)", "MacIntel", 0)).toBe(false);
    expect(shouldUseNativeFacebookShare("Mozilla/5.0 (Linux; Android 15)", "Linux armv8l", 5)).toBe(false);
  });

  it("verifies a dedicated news page before sharing it", async () => {
    const readyFetch = vi.fn().mockResolvedValue(new Response(null, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }));
    const missingFetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(isNewsSharePageReady("https://verkhovskiy.ai/share/v3/news/abc/", readyFetch)).resolves.toBe(true);
    await expect(isNewsSharePageReady("https://verkhovskiy.ai/share/v3/news/abc/", missingFetch)).resolves.toBe(false);
    expect(readyFetch).toHaveBeenCalledWith(
      "https://verkhovskiy.ai/share/v3/news/abc/",
      { method: "HEAD", cache: "no-store" },
    );
  });

  it("does not preflight ordinary dashboard section links", async () => {
    const fetcher = vi.fn();
    await expect(isNewsSharePageReady("https://verkhovskiy.ai/?share=insights#insights", fetcher)).resolves.toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
