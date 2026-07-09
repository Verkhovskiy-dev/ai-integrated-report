/*
 * /programs — full SKOLKOVO catalog page:
 * programs grid + recommendations + mastery ladder.
 */
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ProgramsSection from "@/components/ProgramsSection";
import SkolkovoRecommendations from "@/components/SkolkovoRecommendations";
import Footer from "@/components/Footer";
import { useTranslation } from "@/contexts/I18nContext";

export default function Programs() {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  useEffect(() => {
    document.title = isEn
      ? "SKOLKOVO Programs — AI Integrated Report"
      : "Программы СКОЛКОВО — AI Integrated Report";
    window.scrollTo(0, 0);
  }, [isEn]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex items-center justify-between h-12 sm:h-14">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Back to dashboard" : "Назад к дашборду"}
          </a>
          <h1 className="text-sm font-semibold font-heading text-foreground">
            {isEn ? "SKOLKOVO Educational Programs" : "Образовательные программы СКОЛКОВО"}
          </h1>
        </div>
      </header>
      <main className="relative z-10">
        <section className="py-8 sm:py-12">
          <ProgramsSection />
        </section>
        <section className="py-8 sm:py-12">
          <SkolkovoRecommendations />
        </section>
      </main>
      <Footer />
    </div>
  );
}
