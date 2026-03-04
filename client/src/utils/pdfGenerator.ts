/**
 * PDF Report Generator — Vector-based PDF export using jsPDF
 * Generates professional PDF reports with Cyrillic support,
 * searchable text, tables, charts, headers/footers.
 */
import type { DashboardData } from "@/contexts/LiveDataContext";
import type { StrategicInsight } from "@/data/insightsData";
import {
  getNodalPositions,
  getEducationRecommendations,
  getSkolkovoPrograms,
} from "@/data/insightsDataLocalized";
import { getSrtLevels, REPORT_PERIOD } from "@/data/reportDataLocalized";
import type { Locale } from "@/contexts/I18nContext";

// ─── Types ───────────────────────────────────────────────────
interface jsPDFInstance {
  addFileToVFS(filename: string, data: string): void;
  addFont(postScriptName: string, fontName: string, fontStyle: string): void;
  setFont(fontName: string, fontStyle?: string): void;
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setLineWidth(width: number): void;
  text(text: string, x: number, y: number, options?: any): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  circle(x: number, y: number, r: number, style?: string): void;
  addPage(): void;
  save(filename: string): void;
  getStringUnitWidth(text: string): number;
  internal: { pageSize: { getWidth(): number; getHeight(): number }; getNumberOfPages(): number };
  setPage(page: number): void;
  getNumberOfPages(): number;
}

// ─── Constants ───────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 15;
const MARGIN_R = 15;
const MARGIN_T = 20;
const MARGIN_B = 20;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const FOOTER_Y = PAGE_H - 12;

// Colors (RGB)
const C = {
  bg:        [15, 15, 35] as [number, number, number],
  bgCard:    [22, 22, 50] as [number, number, number],
  bgCardAlt: [28, 28, 60] as [number, number, number],
  text:      [230, 230, 240] as [number, number, number],
  textMuted: [140, 140, 170] as [number, number, number],
  primary:   [34, 211, 238] as [number, number, number],   // cyan
  amber:     [245, 158, 11] as [number, number, number],
  green:     [16, 185, 129] as [number, number, number],
  red:       [239, 68, 68] as [number, number, number],
  pink:      [236, 72, 153] as [number, number, number],
  violet:    [139, 92, 246] as [number, number, number],
  orange:    [249, 115, 22] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  divider:   [60, 60, 90] as [number, number, number],
  tableBg:   [18, 18, 42] as [number, number, number],
  tableRow:  [25, 25, 55] as [number, number, number],
  tableRowAlt: [30, 30, 65] as [number, number, number],
};

// ─── Helpers ─────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

class PdfBuilder {
  doc: jsPDFInstance;
  y: number = MARGIN_T;
  pageNum: number = 1;
  locale: string;
  isEn: boolean;
  data: DashboardData;

  constructor(doc: jsPDFInstance, data: DashboardData, locale: string) {
    this.doc = doc;
    this.data = data;
    this.locale = locale;
    this.isEn = locale === 'en';
  }

  // ─── Page background ──────────────────────────────────────
  fillPageBg() {
    this.doc.setFillColor(...C.bg);
    this.doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  }

  // ─── Check if we need a new page ──────────────────────────
  ensureSpace(needed: number) {
    if (this.y + needed > PAGE_H - MARGIN_B) {
      this.newPage();
    }
  }

  newPage() {
    this.doc.addPage();
    this.pageNum++;
    this.fillPageBg();
    this.y = MARGIN_T;
  }

  // ─── Text helpers ─────────────────────────────────────────
  setFont(style: "normal" | "bold" = "normal", size: number = 10, color: [number, number, number] = C.text) {
    this.doc.setFont("Roboto", style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  writeText(text: string, x: number = MARGIN_L, maxWidth: number = CONTENT_W, lineHeight: number = 4.5) {
    const lines = this.doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      this.ensureSpace(lineHeight + 2);
      this.doc.text(line, x, this.y);
      this.y += lineHeight;
    }
  }

  writeParagraph(text: string, indent: number = 0) {
    this.setFont("normal", 9, C.text);
    const x = MARGIN_L + indent;
    const w = CONTENT_W - indent;
    const lines = this.doc.splitTextToSize(text, w);
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, x, this.y);
      this.y += 4.2;
    }
    this.y += 2;
  }

  // ─── Section title ────────────────────────────────────────
  sectionTitle(title: string, subtitle?: string) {
    this.ensureSpace(18);
    // Accent line
    this.doc.setFillColor(...C.primary);
    this.doc.rect(MARGIN_L, this.y - 3, 40, 0.8, "F");
    this.y += 3;
    // Title
    this.setFont("bold", 14, C.white);
    this.doc.text(title, MARGIN_L, this.y);
    this.y += 6;
    if (subtitle) {
      this.setFont("normal", 8, C.textMuted);
      this.doc.text(subtitle, MARGIN_L, this.y);
      this.y += 5;
    }
    this.y += 3;
  }

  // ─── Subsection title ─────────────────────────────────────
  subsectionTitle(title: string, color: [number, number, number] = C.primary) {
    this.ensureSpace(12);
    this.doc.setFillColor(...color);
    this.doc.circle(MARGIN_L + 1.5, this.y - 1, 1.5, "F");
    this.setFont("bold", 10, C.white);
    this.doc.text(title, MARGIN_L + 6, this.y);
    this.y += 6;
  }

  // ─── Divider ──────────────────────────────────────────────
  divider() {
    this.ensureSpace(6);
    this.doc.setDrawColor(...C.divider);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN_L, this.y, PAGE_W - MARGIN_R, this.y);
    this.y += 5;
  }

  // ─── Metric card ──────────────────────────────────────────
  drawMetricCards(metrics: { label: string; value: number; suffix: string }[]) {
    const cardW = (CONTENT_W - 10) / 3;
    const cardH = 18;
    this.ensureSpace(cardH + 5);
    for (let i = 0; i < metrics.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = MARGIN_L + col * (cardW + 5);
      const yBase = this.y + row * (cardH + 4);
      // Card bg
      this.doc.setFillColor(...C.bgCard);
      this.doc.roundedRect(x, yBase, cardW, cardH, 2, 2, "F");
      // Border
      this.doc.setDrawColor(...C.divider);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(x, yBase, cardW, cardH, 2, 2, "S");
      // Value — if value is 0 and suffix exists, show only suffix (e.g. date)
      this.setFont("bold", 14, C.primary);
      const displayVal = metrics[i].value === 0 && metrics[i].suffix
        ? metrics[i].suffix
        : `${metrics[i].value}${metrics[i].suffix}`;
      this.doc.text(displayVal, x + cardW / 2, yBase + 9, { align: "center" });
      // Label
      this.setFont("normal", 7, C.textMuted);
      this.doc.text(metrics[i].label, x + cardW / 2, yBase + 14.5, { align: "center" });
    }
    const rows = Math.ceil(metrics.length / 3);
    this.y += rows * (cardH + 4) + 4;
  }

  // ─── Table ────────────────────────────────────────────────
  drawTable(headers: string[], rows: string[][], colWidths: number[], options?: { headerColor?: [number, number, number] }) {
    const headerColor = options?.headerColor || C.primary;
    const rowH = 7;
    const headerH = 8;
    const totalH = headerH + rows.length * rowH + 4;
    this.ensureSpace(Math.min(totalH, 60)); // At least header + a few rows

    let x = MARGIN_L;
    // Header
    this.doc.setFillColor(...C.bgCard);
    this.doc.rect(MARGIN_L, this.y - 1, CONTENT_W, headerH, "F");
    this.setFont("bold", 7.5, headerColor);
    for (let i = 0; i < headers.length; i++) {
      this.doc.text(headers[i], x + 2, this.y + 4);
      x += colWidths[i];
    }
    this.y += headerH;

    // Rows
    for (let r = 0; r < rows.length; r++) {
      this.ensureSpace(rowH + 2);
      const bgColor = r % 2 === 0 ? C.tableRow : C.tableRowAlt;
      this.doc.setFillColor(...bgColor);
      this.doc.rect(MARGIN_L, this.y - 1, CONTENT_W, rowH, "F");
      x = MARGIN_L;
      this.setFont("normal", 7, C.text);
      for (let c = 0; c < rows[r].length; c++) {
        const cellText = this.doc.splitTextToSize(rows[r][c], colWidths[c] - 4);
        this.doc.text(cellText[0] || "", x + 2, this.y + 3.5);
        x += colWidths[c];
      }
      this.y += rowH;
    }
    this.y += 4;
  }

  // ─── Bar chart (horizontal) ───────────────────────────────
  drawHorizontalBars(items: { label: string; value: number; color: string }[], maxValue?: number) {
    const barH = 6;
    const gap = 3;
    const labelW = 55;
    const barMaxW = CONTENT_W - labelW - 20;
    const max = maxValue || Math.max(...items.map(i => i.value));

    for (const item of items) {
      this.ensureSpace(barH + gap + 2);
      // Label
      this.setFont("normal", 7, C.text);
      const truncLabel = item.label.length > 28 ? item.label.substring(0, 26) + "…" : item.label;
      this.doc.text(truncLabel, MARGIN_L, this.y + 4);
      // Bar background
      this.doc.setFillColor(...C.bgCard);
      this.doc.roundedRect(MARGIN_L + labelW, this.y, barMaxW, barH, 1, 1, "F");
      // Bar fill
      const w = Math.max(2, (item.value / max) * barMaxW);
      const rgb = hexToRgb(item.color);
      this.doc.setFillColor(...rgb);
      this.doc.roundedRect(MARGIN_L + labelW, this.y, w, barH, 1, 1, "F");
      // Value
      this.setFont("bold", 7, C.white);
      this.doc.text(String(item.value), MARGIN_L + labelW + w + 3, this.y + 4.2);
      this.y += barH + gap;
    }
    this.y += 3;
  }

  // ─── Heatmap ──────────────────────────────────────────────
  drawHeatmap(heatmapData: { date: string; levels: Record<number, number> }[]) {
    const levels = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const cellW = Math.min(10, (CONTENT_W - 30) / heatmapData.length);
    const cellH = 6;
    const labelW = 30;
    const totalH = levels.length * (cellH + 1) + 20;
    this.ensureSpace(Math.min(totalH, 80));

    // Date headers
    this.setFont("normal", 5, C.textMuted);
    for (let d = 0; d < heatmapData.length; d++) {
      const x = MARGIN_L + labelW + d * (cellW + 1);
      this.doc.text(heatmapData[d].date.replace("Feb ", "F").replace("Jan ", "J"), x + 1, this.y + 3, { angle: 0 });
    }
    this.y += 6;

    // Rows
    for (const lvl of levels) {
      this.ensureSpace(cellH + 3);
      const localSrtLevels = getSrtLevels(this.locale as Locale);
      const srtLevel = localSrtLevels.find(l => l.id === lvl);
      this.setFont("normal", 5.5, C.textMuted);
      this.doc.text(srtLevel?.short || `L${lvl}`, MARGIN_L, this.y + 4);

      for (let d = 0; d < heatmapData.length; d++) {
        const val = heatmapData[d].levels[lvl] || 0;
        const x = MARGIN_L + labelW + d * (cellW + 1);
        // Intensity color
        const intensity = Math.min(val / 4, 1);
        const r = Math.round(15 + intensity * 20);
        const g = Math.round(15 + intensity * 196);
        const b = Math.round(35 + intensity * 203);
        this.doc.setFillColor(r, g, b);
        this.doc.roundedRect(x, this.y, cellW, cellH, 0.5, 0.5, "F");
        // Value text
        if (val > 0) {
          this.setFont("bold", 5, val >= 3 ? C.white : C.textMuted);
          this.doc.text(String(val), x + cellW / 2, this.y + 4, { align: "center" });
        }
      }
      this.y += cellH + 1;
    }
    this.y += 5;
  }

  // ─── Urgency badge ────────────────────────────────────────
  drawUrgencyBadge(urgency: string, x: number, y: number) {
    const color = urgency === "high" ? C.red : urgency === "medium" ? C.amber : C.green;
    this.doc.setFillColor(...color);
    this.doc.circle(x + 2, y, 1.5, "F");
    this.setFont("normal", 6, color);
    const label = this.isEn
      ? (urgency === "high" ? "High" : urgency === "medium" ? "Medium" : "Low")
      : (urgency === "high" ? "Высокая" : urgency === "medium" ? "Средняя" : "Низкая");
    this.doc.text(label, x + 5, y + 1);
  }

  // ─── Add headers/footers to all pages ─────────────────────
  addHeadersFooters(title: string, date: string) {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      // Header line
      this.doc.setDrawColor(...C.divider);
      this.doc.setLineWidth(0.3);
      this.doc.line(MARGIN_L, 13, PAGE_W - MARGIN_R, 13);
      // Header text
      this.setFont("normal", 6, C.textMuted);
      this.doc.text(title, MARGIN_L, 11);
      this.doc.text(date, PAGE_W - MARGIN_R, 11, { align: "right" });
      // Footer
      this.doc.setDrawColor(...C.divider);
      this.doc.line(MARGIN_L, FOOTER_Y - 3, PAGE_W - MARGIN_R, FOOTER_Y - 3);
      this.setFont("normal", 6, C.textMuted);
      this.doc.text(`${i} / ${totalPages}`, PAGE_W / 2, FOOTER_Y, { align: "center" });
      this.doc.text("verkhovskiy.ai", PAGE_W - MARGIN_R, FOOTER_Y, { align: "right" });
    }
  }
}

// ─── Main export function ────────────────────────────────────
export async function generatePdfReport(data: DashboardData, locale: string): Promise<void> {
  // Dynamic imports
  const { jsPDF } = await import("jspdf");
  const { ROBOTO_REGULAR, ROBOTO_BOLD } = await import("@/fonts/robotoFonts");

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" }) as unknown as jsPDFInstance;

  // Register fonts
  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", ROBOTO_BOLD);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const isEn = locale === "en";
  const SRT_LEVELS = getSrtLevels(locale as Locale);
  const NODAL_POSITIONS = getNodalPositions(locale as Locale);
  const EDUCATION_RECOMMENDATIONS = getEducationRecommendations(locale as Locale);
  const SKOLKOVO_PROGRAMS = getSkolkovoPrograms(locale as Locale);
  const b = new PdfBuilder(doc, data, locale);

  // ═══════════════════════════════════════════════════════════
  // PAGE 1: Cover
  // ═══════════════════════════════════════════════════════════
  b.fillPageBg();

  // Cover design
  b.y = 60;
  // Accent lines
  doc.setFillColor(...C.primary);
  doc.rect(MARGIN_L, b.y, 60, 1.2, "F");
  b.y += 10;

  b.setFont("bold", 28, C.white);
  doc.text("AI Strategic Intelligence", MARGIN_L, b.y);
  b.y += 12;

  b.setFont("normal", 14, C.primary);
  const reportLabel = isEn ? "Integrated Strategic Report" : "Интегрированный стратегический отчёт";
  doc.text(reportLabel, MARGIN_L, b.y);
  b.y += 12;

  // Period info
  doc.setFillColor(...C.bgCard);
  doc.roundedRect(MARGIN_L, b.y, CONTENT_W, 22, 3, 3, "F");
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_L, b.y, CONTENT_W, 22, 3, 3, "S");

  b.setFont("normal", 9, C.textMuted);
  const periodLabel = isEn ? "Report period:" : "Период отчёта:";
  doc.text(periodLabel, MARGIN_L + 8, b.y + 8);
  b.setFont("bold", 11, C.white);
  const periodText = data.isLive
    ? data.reportDate
    : `${REPORT_PERIOD.start} — ${REPORT_PERIOD.end}`;
  doc.text(periodText, MARGIN_L + 8, b.y + 15);

  b.setFont("normal", 9, C.textMuted);
  const reportsLabel = isEn ? "Reports:" : "Отчётов:";
  doc.text(reportsLabel, MARGIN_L + 110, b.y + 8);
  b.setFont("bold", 11, C.primary);
  doc.text(String(data.isLive ? data.archiveReports.length + 1 : REPORT_PERIOD.totalReports), MARGIN_L + 110, b.y + 15);

  b.y += 30;

  // Key focus
  if (data.keyFocus) {
    b.setFont("normal", 8, C.textMuted);
    const focusLabel = isEn ? "Key focus:" : "Фокус дня:";
    doc.text(focusLabel, MARGIN_L, b.y);
    b.y += 5;
    b.setFont("normal", 9, C.text);
    const focusLines = doc.splitTextToSize(data.keyFocus, CONTENT_W);
    for (const line of focusLines) {
      doc.text(line, MARGIN_L, b.y);
      b.y += 4.5;
    }
    b.y += 5;
  }

  // Metrics
  b.y += 5;
  b.drawMetricCards(data.keyMetrics.map(m => ({
    label: m.label,
    value: m.value,
    suffix: m.suffix,
  })));

  // Footer on cover
  b.setFont("normal", 7, C.textMuted);
  doc.text("verkhovskiy.ai", PAGE_W / 2, PAGE_H - 20, { align: "center" });
  const genDate = new Date().toLocaleDateString(isEn ? "en-US" : "ru-RU", {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.text(isEn ? `Generated: ${genDate}` : `Сгенерировано: ${genDate}`, PAGE_W / 2, PAGE_H - 15, { align: "center" });

  // ═══════════════════════════════════════════════════════════
  // PAGE 2+: Key Events / Timeline
  // ═══════════════════════════════════════════════════════════
  b.newPage();
  b.sectionTitle(
    isEn ? "Key Events" : "Ключевые события",
    isEn ? "Major events from the reporting period" : "Наиболее значимые события отчётного периода"
  );

  const evHeaders = [
    isEn ? "Date" : "Дата",
    isEn ? "Event" : "Событие",
    isEn ? "Level" : "Ур.",
    isEn ? "Type" : "Тип",
  ];
  const evRows = data.keyEvents.slice(0, 20).map(e => {
    const srt = SRT_LEVELS.find(l => l.id === e.level);
    return [e.date, e.event, srt?.short || `L${e.level}`, e.type];
  });
  b.drawTable(evHeaders, evRows, [20, 100, 25, 35]);

  // ═══════════════════════════════════════════════════════════
  // Heatmap
  // ═══════════════════════════════════════════════════════════
  b.sectionTitle(
    isEn ? "Activity Heatmap" : "Тепловая карта активности",
    isEn ? "Event intensity by SRT level and date" : "Интенсивность событий по уровням СРТ"
  );
  b.drawHeatmap(data.heatmapData);

  // ═══════════════════════════════════════════════════════════
  // Theme Frequency
  // ═══════════════════════════════════════════════════════════
  b.sectionTitle(
    isEn ? "Key Themes" : "Ключевые темы периода",
    isEn ? "Theme frequency analysis" : "Частотный анализ тем"
  );
  b.drawHorizontalBars(data.themeFrequency.map(t => ({
    label: t.theme,
    value: t.count,
    color: t.color,
  })));

  // ═══════════════════════════════════════════════════════════
  // Top Companies
  // ═══════════════════════════════════════════════════════════
  b.sectionTitle(
    isEn ? "Top Companies" : "Топ компаний по упоминаниям",
    isEn ? "Most mentioned companies" : "Наиболее упоминаемые компании"
  );
  const compHeaders = [
    isEn ? "Company" : "Компания",
    isEn ? "Mentions" : "Упоминания",
    isEn ? "Trend" : "Тренд",
    isEn ? "Category" : "Категория",
  ];
  const compRows = data.topCompanies.map(c => [
    c.name,
    String(c.mentions),
    c.trend === "up" ? "+" : c.trend === "down" ? "-" : "=",
    c.category,
  ]);
  b.drawTable(compHeaders, compRows, [50, 30, 20, 80]);

  // ═══════════════════════════════════════════════════════════
  // Structural Shifts
  // ═══════════════════════════════════════════════════════════
  b.newPage();
  b.sectionTitle(
    isEn ? "Structural Shifts" : "Структурные сдвиги",
    isEn ? "Fundamental changes in AI industry structure" : "Фундаментальные изменения в структуре AI-индустрии"
  );

  for (const shift of data.structuralShifts) {
    b.ensureSpace(35);
    // Card
    doc.setFillColor(...C.bgCard);
    const cardY = b.y;

    // Title
    b.subsectionTitle(shift.title, C.primary);

    // From → To
    b.setFont("bold", 7, C.red);
    doc.text(isEn ? "FROM:" : "ОТ:", MARGIN_L + 6, b.y);
    b.setFont("normal", 8, C.text);
    doc.text(shift.from, MARGIN_L + 18, b.y);
    b.y += 5;

    b.setFont("bold", 7, C.green);
    doc.text(isEn ? "TO:" : "К:", MARGIN_L + 6, b.y);
    b.setFont("normal", 8, C.text);
    const toLines = doc.splitTextToSize(shift.to, CONTENT_W - 24);
    for (const line of toLines) {
      doc.text(line, MARGIN_L + 18, b.y);
      b.y += 4;
    }
    b.y += 1;

    // Mechanism
    if (shift.mechanism) {
      b.setFont("normal", 7, C.textMuted);
      const mechLines = doc.splitTextToSize(shift.mechanism, CONTENT_W - 6);
      for (const line of mechLines) {
        b.ensureSpace(5);
        doc.text(line, MARGIN_L + 6, b.y);
        b.y += 3.5;
      }
    }

    // Trend badge + levels
    b.y += 2;
    const trendLabel = shift.trend === "accelerating"
      ? (isEn ? "Accelerating" : "Ускоряется")
      : shift.trend === "emerging"
        ? (isEn ? "Emerging" : "Формируется")
        : (isEn ? "Decelerating" : "Замедляется");
    const trendColor = shift.trend === "accelerating" ? C.green : shift.trend === "emerging" ? C.amber : C.red;
    doc.setFillColor(...trendColor);
    doc.roundedRect(MARGIN_L + 6, b.y - 3, 25, 5, 1, 1, "F");
    b.setFont("bold", 6, C.white);
    doc.text(trendLabel, MARGIN_L + 6 + 12.5, b.y, { align: "center" });

    // SRT levels
    const levelNames = shift.levels.map(l => SRT_LEVELS.find(s => s.id === l)?.short || `L${l}`).join(", ");
    b.setFont("normal", 6, C.textMuted);
    doc.text(`${isEn ? 'DLS' : 'СРТ'}: ${levelNames}`, MARGIN_L + 35, b.y);

    b.y += 6;
    b.divider();
  }

  // ═══════════════════════════════════════════════════════════
  // Weak Signals
  // ═══════════════════════════════════════════════════════════
  b.newPage();
  b.sectionTitle(
    isEn ? "Weak Signals Radar" : "Радар слабых сигналов",
    isEn ? "Early indicators of potential changes" : "Ранние индикаторы потенциальных изменений"
  );

  for (const signal of data.weakSignals) {
    b.ensureSpace(22);
    const srtLevel = SRT_LEVELS.find(l => l.id === signal.level);

    // Title with level
    b.setFont("bold", 9, C.white);
    doc.text(signal.title, MARGIN_L + 6, b.y);
    b.setFont("normal", 6, C.textMuted);
    doc.text(`${isEn ? "Level" : "Ур."} ${signal.level} — ${srtLevel?.short || ""}`, PAGE_W - MARGIN_R, b.y, { align: "right" });
    b.y += 4;

    // Urgency
    b.drawUrgencyBadge(signal.urgency, MARGIN_L + 6, b.y);
    b.y += 4;

    // Description
    b.setFont("normal", 7.5, C.text);
    const descLines = doc.splitTextToSize(signal.description, CONTENT_W - 6);
    for (const line of descLines) {
      b.ensureSpace(5);
      doc.text(line, MARGIN_L + 6, b.y);
      b.y += 3.8;
    }
    b.y += 4;
  }

  // ═══════════════════════════════════════════════════════════
  // Cross-Level Connections
  // ═══════════════════════════════════════════════════════════
  b.sectionTitle(
    isEn ? "Cross-Level Connections" : "Межуровневые связи",
    isEn ? "Cascading effects between SRT levels" : "Каскадные эффекты между уровнями СРТ"
  );

  for (const conn of data.crossLevelConnections) {
    b.ensureSpace(16);
    const fromLevel = SRT_LEVELS.find(l => l.id === conn.from);
    const toLevel = SRT_LEVELS.find(l => l.id === conn.to);

    b.setFont("bold", 8, C.primary);
    doc.text(conn.title, MARGIN_L + 6, b.y);
    b.y += 4;

    b.setFont("normal", 7, C.textMuted);
    const pathStr = `${fromLevel?.short || `L${conn.from}`} → ${conn.through.map(t => SRT_LEVELS.find(l => l.id === t)?.short || `L${t}`).join(" → ")} → ${toLevel?.short || `L${conn.to}`}`;
    doc.text(pathStr, MARGIN_L + 6, b.y);
    b.y += 4;

    b.setFont("normal", 7.5, C.text);
    const connLines = doc.splitTextToSize(conn.description, CONTENT_W - 6);
    for (const line of connLines) {
      b.ensureSpace(5);
      doc.text(line, MARGIN_L + 6, b.y);
      b.y += 3.8;
    }
    b.y += 5;
  }

  // ═══════════════════════════════════════════════════════════
  // Strategic Insights
  // ═══════════════════════════════════════════════════════════
  b.newPage();
  b.sectionTitle(
    isEn ? "Strategic Insights" : "Стратегические инсайты",
    isEn ? "Key analytical conclusions" : "Ключевые аналитические выводы"
  );

  for (const insight of data.strategicInsights) {
    b.ensureSpace(40);
    const accentRgb = hexToRgb(insight.accentColor);

    // Title
    doc.setFillColor(...accentRgb);
    doc.rect(MARGIN_L, b.y - 3, 3, 12, "F");
    b.setFont("bold", 11, C.white);
    doc.text(insight.title, MARGIN_L + 6, b.y);
    b.y += 5;
    b.setFont("normal", 8, accentRgb);
    doc.text(insight.subtitle, MARGIN_L + 6, b.y);
    b.y += 6;

    // Summary
    b.setFont("normal", 8, C.text);
    const summaryLines = doc.splitTextToSize(insight.summary, CONTENT_W - 6);
    for (const line of summaryLines) {
      b.ensureSpace(5);
      doc.text(line, MARGIN_L + 6, b.y);
      b.y += 4;
    }
    b.y += 3;

    // Evidence
    b.setFont("bold", 7, C.textMuted);
    doc.text(isEn ? "Evidence:" : "Факты:", MARGIN_L + 6, b.y);
    b.y += 4;
    for (const ev of insight.evidence.slice(0, 4)) {
      b.ensureSpace(5);
      b.setFont("normal", 7, C.text);
      doc.text("•", MARGIN_L + 8, b.y);
      const evLines = doc.splitTextToSize(ev, CONTENT_W - 16);
      doc.text(evLines[0], MARGIN_L + 12, b.y);
      b.y += 3.8;
      if (evLines.length > 1) {
        doc.text(evLines[1], MARGIN_L + 12, b.y);
        b.y += 3.8;
      }
    }
    b.y += 2;

    // Non-obvious conclusion
    b.ensureSpace(15);
    doc.setFillColor(...C.bgCardAlt);
    const concText = insight.nonObviousConclusion;
    const concLines = doc.splitTextToSize(concText, CONTENT_W - 16);
    const concH = concLines.length * 4 + 6;
    doc.roundedRect(MARGIN_L + 4, b.y - 2, CONTENT_W - 4, concH, 2, 2, "F");
    b.setFont("bold", 7, C.amber);
    doc.text(isEn ? "KEY INSIGHT:" : "КЛЮЧЕВОЙ ВЫВОД:", MARGIN_L + 8, b.y + 2);
    b.y += 5;
    b.setFont("normal", 7, C.text);
    for (const line of concLines) {
      doc.text(line, MARGIN_L + 8, b.y);
      b.y += 3.8;
    }
    b.y += 5;

    b.divider();
  }

  // ═══════════════════════════════════════════════════════════
  // Nodal Positions
  // ═══════════════════════════════════════════════════════════
  b.newPage();
  b.sectionTitle(
    isEn ? "5 Nodal Positions of AI Economy 2026" : "5 узловых позиций AI-экономики 2026",
    isEn ? "Key control points in the AI industry" : "Ключевые узлы, за контроль которых идёт основная борьба"
  );

  const nodalHeaders = [
    isEn ? "Position" : "Позиция",
    isEn ? "Controllers" : "Кто контролирует",
    isEn ? "Stakes" : "Что на кону",
    isEn ? "Trend" : "Тренд",
  ];
  const nodalRows = NODAL_POSITIONS.map(n => [n.name, n.controllers, n.stakes, n.trend]);
  b.drawTable(nodalHeaders, nodalRows, [35, 55, 45, 45], { headerColor: C.amber });

  // ═══════════════════════════════════════════════════════════
  // Education Recommendations
  // ═══════════════════════════════════════════════════════════
  b.y += 5;
  b.sectionTitle(
    isEn ? "Education Recommendations" : "Рекомендации для образовательных программ",
    isEn ? "Based on identified insights" : "На основании выявленных инсайтов"
  );

  for (const rec of EDUCATION_RECOMMENDATIONS) {
    b.ensureSpace(20);
    b.subsectionTitle(rec.category, C.amber);
    for (const item of rec.items) {
      b.ensureSpace(8);
      b.setFont("normal", 7.5, C.text);
      doc.text("•", MARGIN_L + 8, b.y);
      const itemLines = doc.splitTextToSize(item, CONTENT_W - 16);
      for (const line of itemLines) {
        doc.text(line, MARGIN_L + 12, b.y);
        b.y += 3.8;
      }
      b.y += 1;
    }
    // Programs
    if (rec.relevantPrograms.length > 0) {
      b.setFont("normal", 6, C.primary);
      const progNames = rec.relevantPrograms
        .map(k => SKOLKOVO_PROGRAMS[k]?.shortName || k)
        .join(" | ");
      doc.text(`${isEn ? 'SKOLKOVO' : 'СКОЛКОВО'}: ${progNames}`, MARGIN_L + 8, b.y);
      b.y += 5;
    }
    b.y += 3;
  }

  // ═══════════════════════════════════════════════════════════
  // SKOLKOVO Programs
  // ═══════════════════════════════════════════════════════════
  b.sectionTitle(
    isEn ? "SKOLKOVO Programs" : "Программы СКОЛКОВО",
    isEn ? "Programs relevant to identified trends" : "Программы, релевантные выявленным трендам"
  );

  const progHeaders = [
    isEn ? "Program" : "Программа",
    isEn ? "Short Name" : "Краткое название",
  ];
  const progRows = Object.values(SKOLKOVO_PROGRAMS).map(p => [p.name, p.shortName || ""]);
  b.drawTable(progHeaders, progRows, [120, 60], { headerColor: C.green });

  // ═══════════════════════════════════════════════════════════
  // Add headers and footers to all pages
  // ═══════════════════════════════════════════════════════════
  const headerTitle = "AI Strategic Intelligence Report";
  const headerDate = data.isLive ? data.reportDate : `${REPORT_PERIOD.start} — ${REPORT_PERIOD.end}`;
  b.addHeadersFooters(headerTitle, headerDate);

  // ═══════════════════════════════════════════════════════════
  // Save
  // ═══════════════════════════════════════════════════════════
  const date = new Date().toISOString().split("T")[0];
  doc.save(`ai-report-${date}.pdf`);
}
