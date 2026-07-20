# OPPE Practice

A focused, monochrome question-practice platform for the **IIT Madras BS Degree OPPE**
(Online Proctored Programming Exam). Students browse curated questions by subject and
topic, attempt them against a live timer, and watch their progress grow over time.

**Phase 1**: question practice, timing, progress tracking, and auth.
**Phase 2**: in-browser code execution — Python (Pyodide) as a test-based judge,
interactive MCQ, and SQL (PGlite / Postgres-in-WASM). Shell / Java / C are
registered behind the same runtime interface as honest "not bundled" placeholders.
**Phase 3**: timed mock-exam mode — one countdown, no solutions, graded at submit,
with a proctoring tab-switch counter.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first tokens, no default palette)
- Supabase — Postgres + Auth (`@supabase/ssr`, cookie sessions)
- A bespoke in-repo SVG icon set (no icon library)
- `next-themes` (currently locked to a light-only theme)
- `react-markdown` + `remark-gfm` for question/solution rendering

## Design system

Monochrome, editorial, precision-tool. There is **no accent colour** — hierarchy comes
from weight, size, spacing, and hairline borders. Tokens live in `app/globals.css` as CSS
variables (`--canvas`, `--surface`, `--fg`, `--fg-muted`, `--fg-faint`, `--hairline`,
`--hairline-strong`) exposed to Tailwind via `@theme`. Dark tokens exist but are dormant.
See the full component + icon family at **`/style-guide`**.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Environment (`.env.local`, gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://hzlqdbmyvltvoqiaojjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server-only, never bundled>
```

The `NEXT_PUBLIC_*` keys are safe in the browser. The service-role key is a secret and is
never imported into any component.

## Deploy (Vercel)

`vercel.json` pins the Next.js framework and build. Import the repo into Vercel, then:

1. Add the three environment variables above in **Project → Settings → Environment
   Variables** (never commit them — `.env*` is gitignored). Scope `SUPABASE_SERVICE_ROLE_KEY`
   to the server only.
2. In **Supabase → Authentication → URL Configuration**, add your Vercel URL to the redirect
   allow-list (e.g. `https://<your-app>.vercel.app/**`) and set the Site URL, so auth
   callbacks work in production.
3. Deploy. The migrations/seed in `supabase/` are applied out-of-band with
   `scripts/run-sql.mjs` (they are not part of the Vercel build).

## Database

Schema, RLS, and the profile trigger live in `supabase/migrations/0001_init.sql`.
Seed content (one active Python subject with 25 real OPPE-style questions across five
topics, plus two inactive "Coming soon" subjects) is in `supabase/seed.sql`.

Both are applied via the Supabase Management API with a small helper:

```bash
SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<token> \
  node scripts/run-sql.mjs supabase/migrations/0001_init.sql
SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<token> \
  node scripts/run-sql.mjs supabase/seed.sql
```

`subjects.is_active` is the release switch: flip it to show/hide a subject with no code
change. RLS makes content public-readable while scoping `attempts`, `notes`, and
`profiles` to their owner (`auth.uid()`).

## Execution runtimes (Phase 2)

`components/execution/runtime-area.tsx` dispatches to a runtime by question `kind`:

- **coding → Python** (`python-runtime.tsx`): Pyodide runs in a Blob Web Worker
  (loaded from CDN), executes against stdin, and grades against stored test cases.
  Passing every test auto-records a solved attempt. A per-run timeout kills runaway loops.
- **mcq → MCQ** (`mcq-runtime.tsx`): structured options, checked against the answer.
- **sql → SQL** (`sql-runtime.tsx`): PGlite (Postgres in WASM, from CDN) runs the
  question's `setup_sql` then the learner's query and shows the result grid.
- **shell / java / c → Unavailable**: identical `RuntimeProps` contract, placeholder UI.

Test cases are generated as inputs, then their **expected outputs are computed by
executing each reference solution in Python** (`scripts/build-tests.mjs`) so the judge is
correct. SQL questions are validated in PGlite (`scripts/build-dbms.mjs`) before seeding.

## Test Series (mock exams)

Test Series is the mock-exam flow. A subject's sets are assembled from its questions at
request time (`lib/test-series.ts`), and each set can be attempted in a **Learning**
(untimed) or **Exam** (timed, proctored) environment.

Opening a paper creates a `test_attempts` row (`lib/test-actions.ts`); the runner
(`components/test/test-runner.tsx`) gates the exam behind an instructions screen, runs one
countdown from an absolute start time, counts tab switches, and locks Final Submit until
90 minutes have elapsed. Final Submit — and the timer reaching zero — grade the paper on
the server: **MCQs are graded against the stored key**, coding and SQL are graded by
running their tests in the browser, and the score, time used and tab-switch count are
written to `test_attempts` / `test_answers`.

Submitted exam attempts feed the `mock_leaderboard` view, which is what "My Mock history"
on the progress dashboard reads. Past attempts are listed under the Test Series tab.

> The older `/app/exam` "timed exam" flow was removed — Test Series replaces it.

## Key paths

```
app/                     routes (landing, auth, /app/*, /app/test/*, /style-guide)
components/icons/         bespoke SVG icon set
components/ui/            design primitives (Button, Table, Stat, Timer, …)
components/charts/        hand-rolled monochrome SVG charts
components/execution/     Phase 2 runtimes (python, mcq, sql) + dispatch
components/question/      workspace, controls, solution reveal
components/exam/          exam device guard (shared by Test Series)
components/test/          Test Series runner (instructions, timer, proctoring)
lib/python-runner.ts     Pyodide Blob-worker hook (run + timeout)
lib/grading.ts           output normalisation + judge
lib/queries.ts           server-side data access
lib/metrics.ts           progress aggregation (streaks, accuracy, trends)
lib/actions.ts           server actions (record attempt, save note)
lib/test-actions.ts      startTestAttempt / submitTestAttempt (server grading)
lib/test-series.ts       builds a subject's sets from its questions
lib/supabase/            browser + server clients, session refresh
proxy.ts                 auth session refresh + route gating (Next 16 proxy)
supabase/migrations/     0001 schema+RLS, 0002 execution, 0011 test series
scripts/                 run-sql, build-tests (Python judge), build-dbms (SQL)
```
