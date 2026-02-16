/*
 * DESIGN: "Командный Пункт" — Intelligence Dashboard
 * Dark navy background, cyan/amber/magenta accents
 * Space Grotesk headings, IBM Plex Sans body, IBM Plex Mono data
 * Mobile-first responsive layout
 */
import { useState } from "react";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import MetricsBar from "@/components/MetricsBar";
import TrendCharts from "@/components/TrendCharts";
import HeatmapSection from "@/components/HeatmapSection";
import StrategicInsights from "@/components/StrategicInsights";
import StructuralShifts from "@/components/StructuralShifts";
import WeakSignalsRadar from "@/components/WeakSignalsRadar";
import CrossLevelConnections from "@/components/CrossLevelConnections";
import TopCompanies from "@/components/TopCompanies";
import ThemeFrequency from "@/components/ThemeFrequency";
import NodalPositions from "@/components/NodalPositions";
import Timeline from "@/components/Timeline";
import ProgramsSection from "@/components/ProgramsSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Subtle scan line overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-20 scan-line hidden sm:block" />

      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="relative z-10">
        {/* Bloomberg-style News Ticker */}
        <NewsTicker />

        {/* Hero / Metrics Bar */}
        <MetricsBar />

        {/* Trend Momentum Charts — Accelerating vs Decelerating */}
        <TrendCharts />

        {/* Heatmap: Activity by Level and Date */}
        <section id="heatmap" className="py-8 sm:py-12">
          <HeatmapSection />
        </section>

        {/* Strategic Insights — with program links */}
        <section id="insights" className="py-8 sm:py-12">
          <StrategicInsights />
        </section>

        {/* Two-column layout: Themes + Companies */}
        <section id="themes" className="py-8 sm:py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <ThemeFrequency />
              <TopCompanies />
            </div>
          </div>
        </section>

        {/* Structural Shifts */}
        <section id="shifts" className="py-8 sm:py-12">
          <StructuralShifts />
        </section>

        {/* Cross-Level Connections */}
        <section id="connections" className="py-8 sm:py-12">
          <CrossLevelConnections />
        </section>

        {/* Weak Signals Radar */}
        <section id="signals" className="py-8 sm:py-12">
          <WeakSignalsRadar />
        </section>

        {/* Nodal Positions + Education Recommendations — with program links */}
        <section id="positions" className="py-8 sm:py-12">
          <NodalPositions />
        </section>

        {/* Programs — SKOLKOVO educational programs */}
        <section id="programs" className="py-8 sm:py-12">
          <ProgramsSection />
        </section>

        {/* Timeline */}
        <section id="timeline" className="py-8 sm:py-12">
          <Timeline />
        </section>
      </main>

      <Footer />
    </div>
  );
}
