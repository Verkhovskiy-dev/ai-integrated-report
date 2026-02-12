/*
 * DESIGN: Intelligence Dashboard — Key Metrics Hero Section
 * Big numbers with glow effects, hero background image
 */
import { useEffect, useState } from "react";
import { FileText, Zap, TrendingUp, Radio, Building2, Link } from "lucide-react";
import { KEY_METRICS } from "@/data/reportData";

const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/v7uKuw67xnKHKY8cq65BNf/sandbox/TAGv8ZfRAyZfV9Lj7wYGNr-img-1_1770928035000_na1fn_aGVyby1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdjd1S3V3Njd4bktIS1k4Y3E2NUJOZi9zYW5kYm94L1RBR3Y4WmZSQXlaZlY5TGo3d1lHTnItaW1nLTFfMTc3MDkyODAzNTAwMF9uYTFmbl9hR1Z5YnkxaVp3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=T3OHAF4iqAqalao8ACPE2L-LG9yQ9~hw5DQA2gkkLnLdfhQ7SfW7PqR2X7hTqCTSJB5LKfgrbYkk5wfu~ScefUx2vWekH7-Q5Oi5M-AHe-1AwajwPTGF1QYwsvAqf1Io13k09tiWYmt5hCQVkI1vR7Z-x9eR5rUOLLTpuEpkqWWMxeChpxYwWGAd~74AG2JCw25zc-3rf21q-QjtnQVZ9tLFGpqoJMa7~3GFgSXeV3tS3tI8-EL0-xc6HnntpvcEBkO2G7Uvacu4FszFUIOb0K5krLfzHtjnVWOdpYzNwFIXMuSBX4v-lk4qoXe2GtaVQdldPoWlo3q~TGXyGI61LQ__";

const ICON_MAP: Record<string, typeof FileText> = {
  FileText, Zap, TrendingUp, Radio, Building2, Link,
};

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(Math.round(increment * step));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-mono font-medium tabular-nums">
      {current}{suffix}
    </span>
  );
}

export default function MetricsBar() {
  return (
    <section className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 pt-16 pb-12">
        {/* Title */}
        <div className="mb-10">
          <p className="text-xs font-mono text-primary/80 tracking-widest uppercase mb-2">
            Интегрированный стратегический отчёт
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground leading-tight mb-3">
            AI Daily Reports
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Агрегированный анализ <span className="text-primary font-medium">14 ежедневных отчётов</span> по
            Структуре Разделения Труда (СРТ) в сфере AI, технологий и кибербезопасности.
            Период: <span className="font-mono text-foreground/80">30 января — 12 февраля 2026</span>.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KEY_METRICS.map((metric, i) => {
            const Icon = ICON_MAP[metric.icon];
            return (
              <div
                key={metric.label}
                className="relative group bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {Icon && <Icon className="w-3.5 h-3.5 text-primary/60" />}
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  <AnimatedNumber target={metric.value} suffix={metric.suffix} />
                </div>
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-cyan pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
