import { Check, FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/I18nContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useFilters } from "@/contexts/FilterContext";

type ExportStatus = "idle" | "loading" | "success" | "error";

export default function PdfExport() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const { locale } = useTranslation();
  const data = useLiveData();
  const { viewMode } = useViewMode();
  const { searchQuery, selectedLevels } = useFilters();
  const isEn = locale === "en";
  const exporting = status === "loading";

  const handleExport = async () => {
    // Prevent export while data is still loading
    if (data.loading) {
      return;
    }

    setStatus("loading");
    try {
      const { generatePdfReport } = await import("@/utils/pdfGenerator");
      const filename = await generatePdfReport(data, locale, { viewMode, searchQuery, selectedLevels });
      setStatus("success");
      toast.success(isEn ? "PDF downloaded" : "PDF скачан", { description: filename });
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      console.error("PDF export failed:", err);
      setStatus("error");
      toast.error(isEn ? "PDF export failed" : "Не удалось сформировать PDF", {
        action: { label: isEn ? "Retry" : "Повторить", onClick: handleExport },
      });
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || data.loading}
      title={isEn ? "Export to PDF" : "Экспорт в PDF"}
      className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all ${exporting || data.loading ? "opacity-50 cursor-wait border-border/30 text-muted-foreground" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"}`}
    >
      {exporting ? <LoaderCircle className="w-3 h-3 animate-spin" /> : status === "success" ? <Check className="w-3 h-3" /> : <FileDown className="w-3 h-3" />}
      <span>{exporting ? (isEn ? "Preparing PDF…" : "Готовим PDF…") : "PDF"}</span>
    </button>
  );
}
