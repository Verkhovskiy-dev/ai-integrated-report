/*
 * ViewModeSwitcher: Compact Expert/Executive toggle for the header.
 * Pill-style switcher matching LanguageSwitcher design.
 */
import { Briefcase, Code2 } from "lucide-react";
import { useViewMode, type ViewMode } from "@/contexts/ViewModeContext";
import { useTranslation } from "@/contexts/I18nContext";

export default function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useViewMode();
  const { locale } = useTranslation();

  const options: { value: ViewMode; label: string; labelEn: string; icon: typeof Code2 }[] = [
    { value: "expert", label: "Эксперт", labelEn: "Expert", icon: Code2 },
    { value: "executive", label: "Руководитель", labelEn: "Executive", icon: Briefcase },
  ];

  return (
    <div className="flex items-center rounded-md border border-border/50 overflow-hidden bg-card/40 backdrop-blur-sm">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = viewMode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setViewMode(opt.value)}
            className={`
              flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-medium transition-all duration-200
              ${isActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }
            `}
            title={locale === "en" ? opt.labelEn : opt.label}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{locale === "en" ? opt.labelEn : opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
