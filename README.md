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

## Timed mock exam (Phase 3)

`/app/exam` starts a session over a random subset of a subject's questions. The runner
(`components/exam/exam-runner.tsx`) shows one countdown, hides solutions, and captures
answers; the exam payload **never sends `mcq_answer` or `solution_md`**. On submit, MCQ is
graded authoritatively on the server (`lib/exam-actions.ts`) and coding is graded by
running its tests in the browser. Results show score, time used, and tab-switch count.

## Key paths

```
app/                     routes (landing, auth, /app/*, /app/exam/*, /style-guide)
components/icons/         bespoke SVG icon set
components/ui/            design primitives (Button, Table, Stat, Timer, …)
components/charts/        hand-rolled monochrome SVG charts
components/execution/     Phase 2 runtimes (python, mcq, sql) + dispatch
components/question/      workspace, controls, solution reveal
components/exam/          Phase 3 exam runner + results
lib/python-runner.ts     Pyodide Blob-worker hook (run + timeout)
lib/grading.ts           output normalisation + judge
lib/queries.ts           server-side data access
lib/metrics.ts           progress aggregation (streaks, accuracy, trends)
lib/actions.ts           server actions (record attempt, save note)
lib/exam-actions.ts      startExam / submitExam server actions
lib/supabase/            browser + server clients, session refresh
proxy.ts                 auth session refresh + route gating (Next 16 proxy)
supabase/migrations/     0001 schema+RLS, 0002 execution + exam tables
scripts/                 run-sql, build-tests (Python judge), build-dbms (SQL)
```
