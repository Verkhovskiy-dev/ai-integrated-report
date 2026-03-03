import { FileDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { useLiveData } from "@/contexts/LiveDataContext";

export default function PdfExport() {
  const [exporting, setExporting] = useState(false);
  const { locale } = useTranslation();
  const data = useLiveData();
  const isEn = locale === "en";

  const handleExport = async () => {
    setExporting(true);
    try {
      const { generatePdfReport } = await import("@/utils/pdfGenerator");
      await generatePdfReport(data, locale);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(isEn ? "PDF export error. Please try again." : "Ошибка экспорта PDF. Попробуйте ещё раз.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title={isEn ? "Export to PDF" : "Экспорт в PDF"}
      className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all ${exporting ? "opacity-50 cursor-wait border-border/30 text-muted-foreground" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"}`}
    >
      <FileDown className={`w-3 h-3 ${exporting ? "animate-pulse" : ""}`} />
      <span>PDF</span>
    </button>
  );
}
