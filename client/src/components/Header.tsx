/*
 * DESIGN: Intelligence Dashboard Header
 * Sticky top bar with navigation, dark glass effect
 * Mobile: hamburger menu; Desktop: horizontal nav
 */
import { useState } from "react";
import {
  Activity, Radio, TrendingUp, Network, Clock, LayoutGrid,
  Lightbulb, Target, Menu, X
} from "lucide-react";

const NAV_ITEMS = [
  { id: "heatmap", label: "Обзор", icon: LayoutGrid },
  { id: "insights", label: "Инсайты", icon: Lightbulb },
  { id: "themes", label: "Темы", icon: Activity },
  { id: "shifts", label: "Сдвиги", icon: TrendingUp },
  { id: "connections", label: "Связи", icon: Network },
  { id: "signals", label: "Сигналы", icon: Radio },
  { id: "positions", label: "Узлы", icon: Target },
  { id: "timeline", label: "Хронология", icon: Clock },
];

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Header({ activeSection, onSectionChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <p className="text-[10px] text-muted-foreground font-mono">
              СРТ INTEGRATED REPORT — JAN 30 – FEB 12, 2026
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-xs font-semibold font-heading tracking-tight text-foreground">
              AI Intelligence
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`
                  flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200
                  ${isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl">
          <nav className="container py-3 grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${isActive
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground bg-muted/20 border border-transparent"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
