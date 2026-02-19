import { Sparkles, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";

interface ForecastItem {
  title: string;
  direction: "up" | "down" | "neutral";
  confidence: number;
  description: string;
  basedOn: string;
}

function generateForecasts(reports: LiveReport[]): ForecastItem[] {
  if (reports.length < 2) return [];
  const levelTrends: Record<number, number[]> = {};
  const sorted = [...reports].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of sorted) {
    for (const sl of r.srt_levels) {
      if (!levelTrends[sl.level]) levelTrends[sl.level] = [];
      levelTrends[sl.level].push(sl.event_count);
    }
  }
  const forecasts: ForecastItem[] = [];
  const LEVEL_NAMES: Record<number, string> = {
    9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
    5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
  };
  for (const [levelStr, counts] of Object.entries(levelTrends)) {
    const level = Number(levelStr);
    if (counts.length < 2) continue;
    const recent = counts.slice(-3);
    const earlier = counts.slice(0, Math.max(1, counts.length - 3));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (earlierAvg === 0) continue;
    const changePct = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    if (Math.abs(changePct) > 15) {
      const direction = changePct > 0 ? "up" as const : "down" as const;
      const confidence = Math.min(90, 50 + Math.abs(changePct) * 0.5);
      forecasts.push({
        title: `Ур.${level} ${LEVEL_NAMES[level]}: ${direction === "up" ? "рост" : "снижение"} активности`,
        direction,
        confidence: Math.round(confidence),
        description: direction === "up"
          ? `Ожидается продолжение роста событий на уровне ${LEVEL_NAMES[level]} (+${Math.round(changePct)}% за последние отчёты).`
          : `Активность на уровне ${LEVEL_NAMES[level]} снижается (${Math.round(changePct)}%). Возможна стабилизация.`,
        basedOn: `${counts.length} отчётов, тренд ${Math.round(changePct)}%`,
      });
    }
  }
  const latestReport = sorted[sorted.length - 1];
  if (latestReport.cross_level_links.length > 2) {
    forecasts.push({
      title: "Усиление межуровневых связей",
      direction: "up",
      confidence: 65,
      description: "Количество межуровневых связей растёт, что указывает на системную интеграцию трендов.",
      basedOn: `${latestReport.cross_level_links.length} связей в последнем отчёте`,
    });
  }
  return forecasts.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

export default function Forecasts() {
  const { archiveReports, latestReport } = useLiveData();
  const allReports = latestReport ? [...archiveReports.filter((r) => r.date !== latestReport.date), latestReport] : archiveReports;
  const forecasts = generateForecasts(allReports);

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-amber-400/70 tracking-widest uppercase mb-2">Прогнозы</p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Прогнозы на основе трендов</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">Автоматические прогнозы на основе анализа динамики событий по уровням СРТ.</p>
      </div>
      {forecasts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Недостаточно данных для прогнозов.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {forecasts.map((f, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border/40 bg-muted/10 hover:border-border/60 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {f.direction === "up" ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : f.direction === "down" ? <ArrowDownRight className="w-4 h-4 text-red-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs font-mono text-muted-foreground">Уверенность: {f.confidence}%</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
              </div>
              <h4 className="text-sm font-heading font-semibold text-foreground mb-1.5">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{f.description}</p>
              <div className="flex items-center gap-1">
                <div className="h-1 flex-1 rounded-full bg-muted/30 overflow-hidden">
                  <div className={`h-full rounded-full ${f.direction === "up" ? "bg-emerald-400/60" : f.direction === "down" ? "bg-red-400/60" : "bg-amber-400/60"}`} style={{ width: `${f.confidence}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">{f.basedOn}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
