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
    // Prevent export while data is still loading
    if (data.loading) {
      alert(isEn ? "Data is still loading. Please wait." : "Данные ещё загружаются. Пожалуйста, подождите.");
      return;
    }

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
      disabled={exporting || data.loading}
      title={isEn ? "Export to PDF" : "Экспорт в PDF"}
      className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all ${exporting || data.loading ? "opacity-50 cursor-wait border-border/30 text-muted-foreground" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"}`}
    >
      <FileDown className={`w-3 h-3 ${exporting ? "animate-pulse" : ""}`} />
      <span>PDF</span>
    </button>
  );
}
