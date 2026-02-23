/*
 * DESIGN: Intelligence Dashboard Header
 * Sticky top bar with navigation, dark glass effect
 * Mobile: hamburger menu; Desktop: horizontal nav
 * Now with i18n support and language switcher
 */
import { useState } from "react";
import {
  Activity, Radio, TrendingUp, Network, Clock, LayoutGrid,
  Lightbulb, Target, Menu, X, GraduationCap, BarChart3, Sparkles, BookOpen, Newspaper
} from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "@/contexts/I18nContext";
import PdfExport from "@/components/PdfExport";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavItem {
  id: string;
  labelKey: string;
  icon: typeof Activity;
}

const NAV_ITEMS: NavItem[] = [
  { id: "news", labelKey: "news", icon: Newspaper },
  { id: "heatmap", labelKey: "overview", icon: LayoutGrid },
  { id: "insights", labelKey: "insights", icon: Lightbulb },
  { id: "themes", labelKey: "themes", icon: Activity },
  { id: "shifts", labelKey: "shifts", icon: TrendingUp },
  { id: "connections", labelKey: "connections", icon: Network },
  { id: "signals", labelKey: "signals", icon: Radio },
  { id: "wow", labelKey: "weeks", icon: BarChart3 },
  { id: "forecasts", labelKey: "forecasts", icon: Sparkles },
  { id: "positions", labelKey: "nodes", icon: Target },
  { id: "programs", labelKey: "programs", icon: GraduationCap },
  { id: "recommendations", labelKey: "recommendations", icon: BookOpen },
  { id: "timeline", labelKey: "timeline", icon: Clock },
];

const NAV_LABELS_RU: Record<string, string> = {
  news: "Новости",
  overview: "Обзор",
  insights: "Инсайты",
  themes: "Темы",
  shifts: "Сдвиги",
  connections: "Связи",
  signals: "Сигналы",
  weeks: "Недели",
  forecasts: "Прогнозы",
  nodes: "Узлы",
  programs: "Программы",
  recommendations: "Рекомендации",
  timeline: "Хронология",
};

const NAV_LABELS_EN: Record<string, string> = {
  news: "News",
  overview: "Overview",
  insights: "Insights",
  themes: "Themes",
  shifts: "Shifts",
  connections: "Links",
  signals: "Signals",
  weeks: "Weeks",
  forecasts: "Forecasts",
  nodes: "Nodes",
  programs: "Programs",
  recommendations: "Recs",
  timeline: "Timeline",
};

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Header({ activeSection, onSectionChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { reportDate, isLive } = useLiveData();
  const { locale } = useTranslation();

  const navLabels = locale === "en" ? NAV_LABELS_EN : NAV_LABELS_RU;
  const reportLabel = locale === "en" ? "DLS REPORT" : "СРТ REPORT";

  const scrollTo = (id: string) => {
    onSectionChange(id);
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container flex items-center justify-between h-12 sm:h-14">
        {/* Logo / Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold font-heading tracking-tight text-foreground">
              AI Strategic Intelligence
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground font-mono">
                {reportLabel} {reportDate ? `— ${reportDate}` : ""}
              </p>
              {isLive && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
          </div>
          <div className="sm:hidden">
            <h1 className="text-xs font-semibold font-heading tracking-tight text-foreground">
              AI Intelligence
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`
                  flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200
                  ${isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                <span>{navLabels[item.labelKey] || item.labelKey}</span>
              </button>
            );
          })}
          <div className="ml-1 flex items-center gap-1.5">
            <LanguageSwitcher />
            <PdfExport />
          </div>
        </nav>

        {/* Mobile: Lang + PDF + Menu */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <LanguageSwitcher />
          <PdfExport />
          <button
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
          <nav className="container py-3 grid grid-cols-3 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[10px] font-medium transition-all duration-200
                    ${isActive
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground bg-muted/20 border border-transparent"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{navLabels[item.labelKey] || item.labelKey}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
