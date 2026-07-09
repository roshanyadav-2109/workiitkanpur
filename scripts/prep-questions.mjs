// Read the dumped questions JSON and write a compact array for the
// test-generation workflow agents to Read.
//   node scripts/prep-questions.mjs <in.json> <out.json>
import { readFileSync, writeFileSync } from "node:fs";

const inPath = process.argv[2];
const outPath = process.argv[3];
const rows = JSON.parse(readFileSync(inPath, "utf8"));

const compact = rows.map((r, index) => ({
  index,
  id: r.id,
  title: r.title,
  kind: r.kind,
  body_md: r.body_md,
  solution_md: r.solution_md,
}));

writeFileSync(outPath, JSON.stringify(compact, null, 2), "utf8");
const coding = compact.filter((q) => q.kind === "coding").length;
const mcq = compact.filter((q) => q.kind === "mcq").length;
console.log(`Wrote ${outPath}: ${compact.length} questions (${coding} coding, ${mcq} mcq)`);
