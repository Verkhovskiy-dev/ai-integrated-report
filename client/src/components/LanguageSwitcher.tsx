/*
 * LanguageSwitcher: Compact RU/EN toggle for the header.
 * Pill-style switcher with active indicator.
 */
import { useTranslation, type Locale } from "@/contexts/I18nContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "ru", label: "RU" },
    { value: "en", label: "EN" },
  ];

  return (
    <div className="flex items-center rounded-md border border-border/50 overflow-hidden bg-card/40 backdrop-blur-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={`
            px-2 py-1 text-[10px] sm:text-xs font-mono font-medium transition-all duration-200
            ${
              locale === opt.value
                ? "bg-primary/20 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
            }
          `}
          title={opt.value === "ru" ? "Русский" : "English"}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
