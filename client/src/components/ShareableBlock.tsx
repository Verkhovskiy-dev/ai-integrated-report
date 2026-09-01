import { type ReactNode, useState } from "react";
import { Check, Copy, Facebook, Instagram, Send, Share2 } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { buildFacebookShareUrl, buildShareUrl, buildTelegramShareUrl, shouldUseNativeFacebookShare } from "@/lib/share";

type ShareTarget = "telegram" | "facebook" | "instagram" | "copy";

interface ShareableBlockProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

interface ShareButtonProps { id: string; title: string; text?: string; compact?: boolean; className?: string }

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

export function ShareButton({ id, title, text, compact = false, className }: ShareButtonProps) {
  const { locale } = useTranslation();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);
  const shareText = text ? `${title}\n\n${text.slice(0, 320)}` : title;
  const shareUrl = () => buildShareUrl(id, isEn ? "en" : "ru", window.location.href);

  const track = (target: ShareTarget) => {
    window.umami?.track("dashboard_block_share", { block: id, target });
  };

  const copyLink = async (target: ShareTarget = "copy") => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    track(target);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareNatively = async (target: ShareTarget) => {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title, text: shareText, url: shareUrl() });
      track(target);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return true;
      return false;
    }
  };

  const openShare = async (target: "telegram" | "facebook") => {
    // facebook.com/sharer is unreliable when Safari hands it off to the iOS app.
    // The native share sheet preserves the exact per-news URL and lets iOS pass it
    // directly to the installed Facebook app.
    if (target === "facebook"
      && shouldUseNativeFacebookShare(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
      && await shareNatively(target)) return;

    const outboundUrl = target === "telegram"
      ? buildTelegramShareUrl(shareUrl(), shareText)
      : buildFacebookShareUrl(shareUrl());
    track(target);
    window.open(outboundUrl, "_blank", "noopener,noreferrer,width=720,height=640");
  };

  const shareToInstagram = async () => {
    if (await shareNatively("instagram")) return;
    await copyLink("instagram");
  };

  return (
      <div className={cn("z-30", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={isEn ? `Share ${title}` : `Поделиться: ${title}`}
              className={cn("inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/90 font-mono text-muted-foreground shadow-lg shadow-background/30 backdrop-blur-md transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=open]:border-primary/50 data-[state=open]:text-primary", compact ? "h-8 w-8 justify-center p-0 opacity-70 hover:opacity-100" : "h-9 px-3 text-[11px] sm:opacity-0 sm:translate-y-1 sm:group-hover/share:translate-y-0 sm:group-hover/share:opacity-100 data-[state=open]:translate-y-0 data-[state=open]:opacity-100")}
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Share2 className="size-3.5" />}
              {!compact && <span className="hidden md:inline">{copied ? (isEn ? "Copied" : "Скопировано") : (isEn ? "Share" : "Поделиться")}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 border-primary/20 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <DropdownMenuLabel className="px-2 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {isEn ? "Share this section" : "Поделиться блоком"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openShare("telegram")} className="h-10 cursor-pointer">
              <Send className="text-sky-400" /> Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openShare("facebook")} className="h-10 cursor-pointer">
              <Facebook className="text-blue-400" /> Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={shareToInstagram} className="h-10 cursor-pointer">
              <Instagram className="text-fuchsia-400" /> Instagram
              <span className="ml-auto text-[9px] font-mono text-muted-foreground">{isEn ? "share sheet" : "меню ОС"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => copyLink()} className="h-10 cursor-pointer">
              {copied ? <Check className="text-emerald-400" /> : <Copy />}
              {copied ? (isEn ? "Link copied" : "Ссылка скопирована") : (isEn ? "Copy link" : "Копировать ссылку")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  );
}

export default function ShareableBlock({ id, title, children, className }: ShareableBlockProps) {
  return (
    <div className={cn("group/share relative", className)} data-shareable-block={id}>
      {children}
      <ShareButton id={id} title={title} className="absolute right-3 top-2 sm:right-6 sm:top-3" />
    </div>
  );
}
