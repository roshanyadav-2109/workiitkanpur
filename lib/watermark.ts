import { createHash } from "node:crypto";

/**
 * An invisible mark of the account a question was shown to, written into the
 * question's first sentence of prose as zero-width characters: a word joiner,
 * 32 bits, a word joiner. It does not show, does not change how the text reads
 * or wraps, and survives copy and paste — so a question found on another site
 * can be traced to the account that opened it:
 *
 *   node scripts/find-watermark.mjs copied.html
 *
 * Only questions shown to a signed-in student are marked. What a visitor sees
 * before signing in is the same for everyone and carries no mark.
 */

const ZERO = "​";
const ONE = "‌";
const EDGE = "⁠";

/** The 32-bit mark of an account: the first 8 hex digits of sha256(user id). */
export function markOf(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 8);
}

/** The mark as zero-width characters. */
export function encodeMark(mark: string): string {
  const bits = Number.parseInt(mark, 16).toString(2).padStart(32, "0");
  return `${EDGE}${[...bits].map((bit) => (bit === "1" ? ONE : ZERO)).join("")}${EDGE}`;
}

/**
 * Where in Markdown a mark can go unseen and unharmed: after a space between
 * two letters of plain prose — never inside $maths$ or `code`, nor on a table
 * row, a heading, a quote or a list line, where a stray character could change
 * what the line is. -1 when there is no such place.
 */
export function markAt(md: string): number {
  let math = false;
  let code = false;
  let fence = false;
  let lineStart = 0;
  for (let i = 0; i < md.length; i += 1) {
    const char = md[i];
    if (char === "\n") {
      lineStart = i + 1;
      if (md.startsWith("```", lineStart)) fence = !fence;
    }
    if (i === 0 && md.startsWith("```")) fence = true;
    if (fence) continue;
    if (char === "`") code = !code;
    else if (char === "$" && md[i - 1] !== "\\" && !code) math = !math;
    if (math || code || char !== " ") continue;
    if (/^\s*([|#>]|[-*+]\s|\d+\.\s)/.test(md.slice(lineStart, lineStart + 4))) continue;
    if (/\p{L}/u.test(md[i - 1] ?? "") && /\p{L}/u.test(md[i + 1] ?? "")) return i + 1;
  }
  return -1;
}

/** The Markdown with the account's mark in its first run of prose. Unchanged if it has no room. */
export function watermarkMarkdown(md: string, userId: string): string {
  const at = markAt(md);
  if (at < 0) return md;
  return `${md.slice(0, at)}${encodeMark(markOf(userId))}${md.slice(at)}`;
}
