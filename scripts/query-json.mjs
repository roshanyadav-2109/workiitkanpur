// Run a SELECT via the Supabase Management API and write the full JSON result
// to a file (no truncation).
//   SUPABASE_PROJECT_REF=... SUPABASE_ACCESS_TOKEN=... \
//     node scripts/query-json.mjs <sql-file> <out-file>
import { readFileSync, writeFileSync } from "node:fs";

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const sqlFile = process.argv[2];
const outFile = process.argv[3];

if (!ref || !token || !sqlFile || !outFile) {
  console.error("Need env SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN and <sql-file> <out-file>.");
  process.exit(2);
}

const query = readFileSync(sqlFile, "utf8");
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, text.slice(0, 500));
  process.exit(1);
}
writeFileSync(outFile, text, "utf8");
const rows = JSON.parse(text);
console.log(`Wrote ${outFile}: ${Array.isArray(rows) ? rows.length : "?"} rows`);
