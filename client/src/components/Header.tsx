/*
 * DESIGN: Intelligence Dashboard Header
 * Sticky top bar with navigation, dark glass effect
 */
import { Activity, Radio, TrendingUp, Network, Building2, Clock, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
  { id: "heatmap", label: "Обзор", icon: LayoutGrid },
  { id: "themes", label: "Темы", icon: Activity },
  { id: "shifts", label: "Сдвиги", icon: TrendingUp },
  { id: "connections", label: "Связи", icon: Network },
  { id: "signals", label: "Сигналы", icon: Radio },
  { id: "timeline", label: "Хронология", icon: Clock },
];

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Header({ activeSection, onSectionChange }: HeaderProps) {
  const scrollTo = (id: string) => {
    onSectionChange(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container flex items-center justify-between h-14">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold font-heading tracking-tight text-foreground">
              AI Strategic Intelligence
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              СРТ INTEGRATED REPORT — JAN 30 – FEB 12, 2026
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                  ${isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
