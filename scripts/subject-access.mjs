// Open or close a subject to the public.
//
//   node scripts/subject-access.mjs                 # list every subject
//   node scripts/subject-access.mjs dbms --close    # take it off the site
//   node scripts/subject-access.mjs dbms --open     # put it back
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// environment, falling back to .env.local.
//
// Closing a subject hides it everywhere it can be reached: the subject page,
// its practice list, its papers, a direct link to one of its questions, and the
// question PDF. The subject still appears on the subjects page as "Coming
// soon", which is what makes it a release switch rather than a delete.
//
// Attempts, papers and questions are untouched, so re-opening restores exactly
// what was there.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function credentials() {
  const out = { ...process.env };
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && !out[m[1]]) out[m[1]] = m[2].trim();
    }
  } catch {
    /* rely on the real environment */
  }
  return out;
}
const ENV = credentials();
const URL_ = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY)
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or put them in .env.local).",
  );

async function rest(path, method = "GET", body, headers = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const open = args.includes("--open");
const close = args.includes("--close");

const subjects = await rest(
  "subjects?select=slug,name,is_active,sort_order&order=sort_order",
);

/** How much is behind each subject, so closing one is an informed decision. */
async function countsFor(id) {
  const count = async (path) => {
    const r = await fetch(`${URL_}/rest/v1/${path}`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    return Number((r.headers.get("content-range") || "").split("/")[1] ?? 0);
  };
  return {
    questions: await count(`questions?select=id&subject_id=eq.${id}`),
    papers: await count(`test_sets?select=id&subject_id=eq.${id}`),
  };
}

if (!slug || (!open && !close)) {
  console.log("Subjects\n");
  for (const s of subjects) {
    console.log(
      `  ${s.is_active ? "OPEN  " : "closed"}  ${s.slug.padEnd(10)} ${s.name}`,
    );
  }
  console.log(
    "\n  node scripts/subject-access.mjs <slug> --open|--close\n" +
      "  Closed subjects still show on the subjects page as coming soon;\n" +
      "  their questions, papers and PDFs stop being reachable.",
  );
  process.exit(0);
}

const subject = subjects.find((s) => s.slug === slug);
if (!subject) {
  console.error(
    `No subject "${slug}". Known: ${subjects.map((s) => s.slug).join(", ")}`,
  );
  process.exit(1);
}

const want = open;
if (subject.is_active === want) {
  console.log(`"${subject.name}" is already ${want ? "open" : "closed"}.`);
  process.exit(0);
}

const [{ id }] = await rest(`subjects?select=id&slug=eq.${slug}`);
const { questions, papers } = await countsFor(id);

await rest(`subjects?slug=eq.${slug}`, "PATCH", { is_active: want }, {
  Prefer: "return=minimal",
});

console.log(
  `"${subject.name}" is now ${want ? "OPEN to the public" : "CLOSED"}.\n` +
    `  ${questions} question(s) and ${papers} paper(s) ` +
    `${want ? "are reachable again" : "are no longer reachable"}. Nothing was deleted.`,
);
