/**
 * Which account did copied questions come from?
 *
 *   node scripts/find-watermark.mjs copied.html     a saved page, or any text file
 *   pbpaste | node scripts/find-watermark.mjs       text on the clipboard
 *
 * Reads the invisible marks that every question shown to a signed-in student
 * carries (lib/watermark.ts) and matches them against every account. Copy the
 * questions from the other site as they are — select and copy, or save the
 * page — since retyping them drops the mark.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const ZERO = "​";
const ONE = "‌";
const EDGE = "⁠";

for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const markOf = (id) => createHash("sha256").update(id).digest("hex").slice(0, 8);
const readMarks = (text) =>
  (text.match(new RegExp(`${EDGE}[${ZERO}${ONE}]{32}${EDGE}`, "g")) ?? []).map((hit) =>
    Number.parseInt([...hit.slice(1, -1)].map((c) => (c === ONE ? "1" : "0")).join(""), 2)
      .toString(16)
      .padStart(8, "0"),
  );

const file = process.argv[2];
const marks = readMarks(file ? readFileSync(file, "utf8") : readFileSync(0, "utf8"));
if (marks.length === 0) {
  console.log("No mark found. The text may have been retyped, or it was copied from a page shown to someone who was not signed in, which is not marked.");
  process.exit(0);
}
const counts = new Map();
for (const m of marks) counts.set(m, (counts.get(m) ?? 0) + 1);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (.env.local).");
const get = async (path) => {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};

const owners = new Map();
for (let from = 0; ; from += 1000) {
  const rows = await get(`profiles?select=id,display_name,public_id&order=id&offset=${from}&limit=1000`);
  for (const row of rows) if (counts.has(markOf(row.id))) owners.set(markOf(row.id), row);
  if (rows.length < 1000) break;
}
for (const [mark, count] of counts) {
  const o = owners.get(mark);
  console.log(o
    ? `${count} × mark ${mark} → account ${o.id}${o.display_name ? ` (${o.display_name})` : ""}`
    : `${count} × mark ${mark} → no account matches (deleted, or not from this site)`);
}
const ids = [...owners.values()].map((o) => o.id);
if (ids.length) {
  const rows = await get(`content_access?select=user_id,question_id,set_id,opened_at&user_id=in.(${ids.join(",")})&order=opened_at.desc&limit=20`);
  if (rows.length) {
    console.log("\nTheir latest openings:");
    for (const r of rows) console.log(`  ${r.opened_at}  ${r.user_id}  ${r.question_id ? "question " + r.question_id : "paper " + r.set_id}`);
  }
}
