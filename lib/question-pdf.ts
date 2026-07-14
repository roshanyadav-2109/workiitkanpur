import { jsPDF } from "jspdf";

/**
 * Renders a question + its solution as a clean, print-ready PDF.
 *
 * Deliberately monochrome: black text on white, grey rules and captions, and a
 * mono face for code. No colour, no decoration — it should read like a proper
 * exam handout, not a web page.
 */

export interface QuestionPdfInput {
  title: string;
  subject: string;
  topic: string | null;
  week: number | null;
  bodyMd: string;
  solutionMd: string | null;
}

// A4 in points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = 20; // near-black
const MUTED = 120; // grey captions/rules

export function buildQuestionPdf(q: QuestionPdfInput): ArrayBuffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
  };
  const need = (h: number) => {
    if (y + h > PAGE_H - MARGIN - 24) newPage();
  };

  /* ---- Masthead -------------------------------------------------------- */
  const meta = [q.subject, q.week != null ? `Week ${q.week}` : null, q.topic]
    .filter(Boolean)
    .join("  ·  ");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(meta.toUpperCase(), MARGIN, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(INK);
  const titleLines = doc.splitTextToSize(q.title, CONTENT_W) as string[];
  for (const line of titleLines) {
    need(24);
    doc.text(line, MARGIN, y);
    y += 22;
  }

  y += 6;
  doc.setDrawColor(MUTED);
  doc.setLineWidth(0.75);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 22;

  /* ---- Body ------------------------------------------------------------ */
  y = renderMarkdown(doc, q.bodyMd, y, need, newPage);

  if (q.solutionMd && q.solutionMd.trim()) {
    y += 10;
    need(50);
    doc.setDrawColor(MUTED);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(INK);
    doc.text("Solution", MARGIN, y);
    y += 20;

    y = renderMarkdown(doc, q.solutionMd, y, need, newPage);
  }

  /* ---- Footers --------------------------------------------------------- */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text("IITM BS Community · practice handout", MARGIN, PAGE_H - 28);
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 28, {
      align: "right",
    });
  }

  return doc.output("arraybuffer");
}

/* -------------------------------------------------------------------------- */

/** Strip inline markdown emphasis/code markers that we can't style inline. */
function plain(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
}

/**
 * Minimal markdown renderer: headings, paragraphs, bullet/numbered lists and
 * fenced code blocks. Enough for question bodies without pulling in a parser.
 */
function renderMarkdown(
  doc: jsPDF,
  md: string,
  startY: number,
  need: (h: number) => void,
  newPage: () => void,
): number {
  let y = startY;
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  const para = (text: string, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(INK);
    const wrapped = doc.splitTextToSize(
      plain(text),
      CONTENT_W - indent,
    ) as string[];
    for (const w of wrapped) {
      need(16);
      doc.text(w, MARGIN + indent, y);
      y += 14.5;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // fenced code block
    if (line.trimStart().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      const boxPad = 8;
      const lineH = 12.5;
      const boxH = code.length * lineH + boxPad * 2;
      if (y + boxH > PAGE_H - MARGIN - 24) newPage();

      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.5);
      doc.rect(MARGIN, y - 2, CONTENT_W, boxH, "FD");

      doc.setFont("courier", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(INK);
      let cy = y + boxPad + 6;
      for (const c of code) {
        const wrapped = doc.splitTextToSize(
          c || " ",
          CONTENT_W - boxPad * 2,
        ) as string[];
        for (const w of wrapped) {
          doc.text(w, MARGIN + boxPad, cy);
          cy += lineH;
        }
      }
      y += boxH + 12;
      continue;
    }

    if (!line.trim()) {
      y += 7;
      continue;
    }

    // headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line.trim());
    if (h) {
      const level = h[1].length;
      const size = level === 1 ? 14 : level === 2 ? 12.5 : 11.5;
      y += 6;
      need(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(INK);
      const wrapped = doc.splitTextToSize(plain(h[2]), CONTENT_W) as string[];
      for (const w of wrapped) {
        need(18);
        doc.text(w, MARGIN, y);
        y += size + 5;
      }
      y += 3;
      continue;
    }

    // bullet / numbered list
    const b = /^\s*[-*+]\s+(.*)$/.exec(line);
    const n = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (b || n) {
      const marker = b ? "•" : `${n![1]}.`;
      const text = b ? b[1] : n![2];
      need(16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(INK);
      doc.text(marker, MARGIN + 4, y);
      para(text, 22);
      y += 2;
      continue;
    }

    para(line);
  }

  return y;
}
