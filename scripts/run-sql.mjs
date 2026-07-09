// Dev utility: execute a .sql file against the Supabase project via the
// Management API. Not part of the app bundle.
//
//   SUPABASE_PROJECT_REF=... SUPABASE_ACCESS_TOKEN=... \
//     node scripts/run-sql.mjs supabase/migrations/0001_init.sql
import { readFileSync } from "node:fs";

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const file = process.argv[2];

if (!ref || !token || !file) {
  console.error("Need SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN env and a file arg.");
  process.exit(2);
}

const query = readFileSync(file, "utf8");

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
console.log("HTTP", res.status);
console.log(text.slice(0, 2000));
if (!res.ok) process.exit(1);
