import { ArrowUpRight, Route } from "lucide-react";
import { useEkenRoutes } from "@/contexts/EkenRoutesContext";
import {
  buildEkenScenarioUrl,
  buildScenarioEkenPayload,
  findDashboardScenario,
  type DashboardRouteSource,
} from "@/data/ekenScenarioRoutes";

interface EkenRouteActionProps extends DashboardRouteSource {
  compact?: boolean;
  className?: string;
}

export default function EkenRouteAction({ compact = false, className = "", ...source }: EkenRouteActionProps) {
  const { registry } = useEkenRoutes();
  const scenario = findDashboardScenario(registry, source);

  const startRoute = () => {
    const analytics = (window as Window & {
      umami?: { track: (event: string, data?: Record<string, string | number>) => void };
    }).umami;
    analytics?.track("route_launch", {
      surface: scenario.surface,
      scenario: scenario.scenarioId,
      source: scenario.sourceId,
      minutes: scenario.estimatedMinutes,
    });
    window.location.href = buildEkenScenarioUrl(buildScenarioEkenPayload(source, scenario));
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startRoute();
      }}
      className={`group/eken inline-flex items-center gap-1.5 rounded-md border border-violet-400/25 bg-violet-400/[0.07] text-violet-200 transition-colors hover:border-violet-300/50 hover:bg-violet-400/[0.13] ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px] sm:text-xs"} ${className}`}
      title={`Следующий прирост: ${scenario.artifact}`}
      aria-label={`${scenario.promise}. Результат: ${scenario.artifact}. ${scenario.estimatedMinutes} минут`}
      data-eken-source={scenario.sourceId}
      data-eken-surface={scenario.surface}
    >
      <Route className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{compact ? "К действию" : "Перейти к действию"} · {scenario.estimatedMinutes} мин</span>
      <ArrowUpRight className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} opacity-60 transition-transform group-hover/eken:-translate-y-0.5 group-hover/eken:translate-x-0.5`} />
    </button>
  );
}
