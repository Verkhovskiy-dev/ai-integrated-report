import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLiveData, type LiveReport } from "@/contexts/LiveDataContext";

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function groupByWeek(reports: LiveReport[]): Map<number, LiveReport[]> {
  const weeks = new Map<number, LiveReport[]>();
  for (const r of reports) {
    const wk = getWeekNumber(r.date);
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk)!.push(r);
  }
  return weeks;
}

interface WeekMetrics {
  weekNum: number;
  totalEvents: number;
  avgEventsPerDay: number;
  topLevels: { level: number; count: number }[];
  reportCount: number;
}

function computeWeekMetrics(weekNum: number, reports: LiveReport[]): WeekMetrics {
  let totalEvents = 0;
  const levelCounts: Record<number, number> = {};
  for (const r of reports) {
    for (const sl of r.srt_levels) {
      totalEvents += sl.event_count;
      levelCounts[sl.level] = (levelCounts[sl.level] || 0) + sl.event_count;
    }
  }
  const topLevels = Object.entries(levelCounts)
    .map(([l, c]) => ({ level: Number(l), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return { weekNum, totalEvents, avgEventsPerDay: reports.length > 0 ? Math.round(totalEvents / reports.length) : 0, topLevels, reportCount: reports.length };
}

const LEVEL_NAMES: Record<number, string> = {
  9: "Капитал", 8: "Институты", 7: "Знания", 6: "Технологии",
  5: "Value Chain", 4: "Hardware", 3: "Профессии", 2: "География", 1: "Ресурсы",
};

export default function WeekOverWeek() {
  const { archiveReports, latestReport } = useLiveData();
  const allReports = latestReport ? [...archiveReports.filter((r) => r.date !== latestReport.date), latestReport] : archiveReports;
  const weeks = groupByWeek(allReports);
  const weekNums = Array.from(weeks.keys()).sort((a, b) => a - b);

  if (weekNums.length < 2) {
    return (
      <div className="container">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-2">Сравнение недель</p>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Week-over-Week</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground text-sm">Недостаточно данных для сравнения недель. Нужно минимум 2 отчёта из разных недель.</div>
      </div>
    );
  }

  const currentWeekNum = weekNums[weekNums.length - 1];
  const prevWeekNum = weekNums[weekNums.length - 2];
  const current = computeWeekMetrics(currentWeekNum, weeks.get(currentWeekNum)!);
  const prev = computeWeekMetrics(prevWeekNum, weeks.get(prevWeekNum)!);
  const eventsChange = prev.totalEvents > 0 ? Math.round(((current.totalEvents - prev.totalEvents) / prev.totalEvents) * 100) : 0;
  const avgChange = prev.avgEventsPerDay > 0 ? Math.round(((current.avgEventsPerDay - prev.avgEventsPerDay) / prev.avgEventsPerDay) * 100) : 0;

  const ChangeIcon = ({ val }: { val: number }) =>
    val > 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> :
    val < 0 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
    <Minus className="w-3.5 h-3.5 text-muted-foreground" />;

  return (
    <div className="container">
      <div className="mb-5 sm:mb-8">
        <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase mb-2">Сравнение недель</p>
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-2">Week-over-Week</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">Сравнение ключевых метрик между неделей {prevWeekNum} и неделей {currentWeekNum}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Всего событий</span>
            <ChangeIcon val={eventsChange} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-bold text-foreground">{current.totalEvents}</span>
            <span className={`text-xs font-mono ${eventsChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eventsChange >= 0 ? "+" : ""}{eventsChange}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Было: {prev.totalEvents} (нед. {prevWeekNum})</div>
        </div>
        <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Среднее/день</span>
            <ChangeIcon val={avgChange} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-bold text-foreground">{current.avgEventsPerDay}</span>
            <span className={`text-xs font-mono ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>{avgChange >= 0 ? "+" : ""}{avgChange}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Было: {prev.avgEventsPerDay} (нед. {prevWeekNum})</div>
        </div>
        <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Топ уровни (нед. {currentWeekNum})</span>
          <div className="mt-2 space-y-1.5">
            {current.topLevels.map((tl) => (
              <div key={tl.level} className="flex items-center justify-between">
                <span className="text-xs text-foreground">Ур.{tl.level} {LEVEL_NAMES[tl.level]}</span>
                <span className="text-xs font-mono text-primary">{tl.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border/40 bg-muted/10">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Топ уровни (нед. {prevWeekNum})</span>
          <div className="mt-2 space-y-1.5">
            {prev.topLevels.map((tl) => (
              <div key={tl.level} className="flex items-center justify-between">
                <span className="text-xs text-foreground">Ур.{tl.level} {LEVEL_NAMES[tl.level]}</span>
                <span className="text-xs font-mono text-muted-foreground">{tl.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />Неделя {currentWeekNum}: {current.reportCount} отчётов</span>
        <span>Неделя {prevWeekNum}: {prev.reportCount} отчётов</span>
      </div>
    </div>
  );
}
