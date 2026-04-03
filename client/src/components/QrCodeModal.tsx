import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DASHBOARD_URL = "https://verkhovskiy.ai";

export default function QrCodeModal() {
  const [open, setOpen] = useState(false);
  const { locale } = useTranslation();
  const isEn = locale === "en";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={isEn ? "Show QR Code" : "Показать QR-код"}
        className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-md border transition-all border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
      >
        <QrCode className="w-3 h-3" />
        <span>QR</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0f0f23]/95 backdrop-blur-xl border-cyan-500/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-lg font-semibold">
              {isEn ? "Scan to open dashboard" : "Сканируйте для перехода на дашборд"}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              {DASHBOARD_URL}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-lg shadow-cyan-500/10">
              <QRCodeSVG
                value={DASHBOARD_URL}
                size={240}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f0f23"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center max-w-[280px]">
              {isEn
                ? "Point your phone camera at the QR code to open the AI Strategic Intelligence dashboard"
                : "Наведите камеру телефона на QR-код, чтобы открыть дашборд AI Strategic Intelligence"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
