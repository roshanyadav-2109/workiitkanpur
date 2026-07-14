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
  /** Absolute URL of the question, linked from the handout. */
  url?: string;
  /** Data URI of the editor screenshot shown at the foot of every handout. */
  screenshot?: string;
}

// A4 in points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = 20; // near-black
const MUTED = 120; // grey captions/rules
const LINK: [number, number, number] = [29, 78, 216]; // the one colour: link blue

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
  doc.text(latin1(meta.toUpperCase()), MARGIN, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(INK);
  const titleLines = doc.splitTextToSize(latin1(q.title), CONTENT_W) as string[];
  for (const line of titleLines) {
    need(24);
    doc.text(line, MARGIN, y);
    y += 22;
  }

  /* ---- Link back to the live question ---------------------------------- */
  if (q.url) {
    y += 4;
    need(20);
    drawLink(doc, "Solve this question online »", MARGIN, y, q.url);
    y += 14;
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

  /* ---- Where you solve it (same shot on every handout) ----------------- */
  if (q.screenshot) {
    const imgW = CONTENT_W;
    const imgH = imgW * (690 / 1536); // native aspect of the capture
    if (y + imgH + 58 > PAGE_H - MARGIN - 24) newPage();
    else y += 18;

    doc.setDrawColor(MUTED);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(INK);
    doc.text("Where you solve it", MARGIN, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(
      "The in-browser editor: question on the left, your code on the right, test cases on submit.",
      MARGIN,
      y,
    );
    y += 12;

    // Alias + compression matter: without them jsPDF stores the bitmap raw and
    // the handout balloons to megabytes.
    doc.addImage(q.screenshot, "PNG", MARGIN, y, imgW, imgH, "editor", "SLOW");
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, imgW, imgH);
    y += imgH + 14;

    if (q.url) {
      need(18);
      drawLink(doc, "Open the editor »", MARGIN, y, q.url);
      y += 14;
    }
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

/**
 * A clickable link in the one accent colour the handout allows.
 *
 * The core PDF fonts only ship regular and bold, so a true semibold isn't
 * available; we fill-then-stroke the glyphs with a hairline in the same blue,
 * which lands between the two rather than going full bold.
 */
function drawLink(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  url: string,
) {
  const text = latin1(label);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(LINK[0], LINK[1], LINK[2]);
  doc.setDrawColor(LINK[0], LINK[1], LINK[2]);
  doc.setLineWidth(0.22);
  doc.text(text, x, y, { renderingMode: "fillThenStroke" });

  const w = doc.getTextWidth(text);
  doc.setLineWidth(0.6);
  doc.line(x, y + 2.2, x + w, y + 2.2);
  doc.link(x, y - 8, w, 11, { url });

  doc.setTextColor(INK);
  doc.setLineWidth(0.75);
}

/**
 * Fold text down to Latin-1.
 *
 * The core PDF fonts are WinAnsi-encoded. jsPDF silently re-encodes any string
 * containing a codepoint above 255 as UTF-16, which Helvetica then renders as
 * garbage — so a single em dash or curly quote in a question body would wreck
 * the whole line. Map the punctuation we actually see, then drop the rest.
 */
export function latin1(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[→➡]/g, "»")
    .replace(/[←]/g, "«")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/[•●]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x00-\xFF]/g, "");
}

/** Strip inline markdown emphasis/code markers that we can't style inline. */
function plain(s: string): string {
  return latin1(
    s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)"),
  );
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
          latin1(c) || " ",
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
