/*
 * DESIGN: "Командный Пункт" — Intelligence Dashboard
 * Dark navy background, cyan/amber/magenta accents
 * Space Grotesk headings, IBM Plex Sans body, IBM Plex Mono data
 */
import { useState } from "react";
import Header from "@/components/Header";
import MetricsBar from "@/components/MetricsBar";
import HeatmapSection from "@/components/HeatmapSection";
import StructuralShifts from "@/components/StructuralShifts";
import WeakSignalsRadar from "@/components/WeakSignalsRadar";
import CrossLevelConnections from "@/components/CrossLevelConnections";
import TopCompanies from "@/components/TopCompanies";
import ThemeFrequency from "@/components/ThemeFrequency";
import Timeline from "@/components/Timeline";
import Footer from "@/components/Footer";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Subtle scan line overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-30 scan-line" />

      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="relative z-10">
        {/* Hero / Metrics Bar */}
        <MetricsBar />

        {/* Heatmap: Activity by Level and Date */}
        <section id="heatmap" className="py-12">
          <HeatmapSection />
        </section>

        {/* Two-column layout: Themes + Companies */}
        <section id="themes" className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ThemeFrequency />
              <TopCompanies />
            </div>
          </div>
        </section>

        {/* Structural Shifts */}
        <section id="shifts" className="py-12">
          <StructuralShifts />
        </section>

        {/* Cross-Level Connections */}
        <section id="connections" className="py-12">
          <CrossLevelConnections />
        </section>

        {/* Weak Signals Radar */}
        <section id="signals" className="py-12">
          <WeakSignalsRadar />
        </section>

        {/* Timeline */}
        <section id="timeline" className="py-12">
          <Timeline />
        </section>
      </main>

      <Footer />
    </div>
  );
}
