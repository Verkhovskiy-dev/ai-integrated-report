import { FileDown } from "lucide-react";
import { useState } from "react";

export default function PdfExport() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const root = document.getElementById("root");
      if (!root) return;

      const canvas = await html2canvas(root, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#0f0f23",
        windowWidth: 1200,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeight = 297;
      let position = 0;

      while (position < imgHeight) {
        if (position > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, -position, imgWidth, imgHeight);
        position += pageHeight;
      }

      const date = new Date().toISOString().split("T")[0];
      pdf.save(`ai-report-${date}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Ошибка экспорта PDF. Попробуйте ещё раз.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title="Экспорт в PDF"
      className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all ${exporting ? "opacity-50 cursor-wait border-border/30 text-muted-foreground" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"}`}
    >
      <FileDown className={`w-3 h-3 ${exporting ? "animate-pulse" : ""}`} />
      <span>PDF</span>
    </button>
  );
}
