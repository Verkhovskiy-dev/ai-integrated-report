/*
 * DESIGN: Intelligence Dashboard — Footer
 * Minimal footer with metadata
 * Mobile-first responsive
 */
import { REPORT_PERIOD } from "@/data/reportData";
import { useLiveData } from "@/contexts/LiveDataContext";

export default function Footer() {
  const { isLive, reportDate } = useLiveData();

  return (
    <footer className="border-t border-border/30 py-6 sm:py-8 mt-8 sm:mt-12">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
              AI Strategic Intelligence — Интегрированный отчёт СРТ
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5 sm:mt-1">
              {isLive
                ? `Дата отчёта: ${reportDate} · Данные из n8n AIwatcher`
                : `Период: ${REPORT_PERIOD.start} — ${REPORT_PERIOD.end} · ${REPORT_PERIOD.totalReports} отчётов`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400" : "bg-amber-400"} pulse-signal`} />
            <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
              {isLive
                ? `Live · Данные актуальны на ${reportDate}`
                : "Статические данные (fallback)"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
