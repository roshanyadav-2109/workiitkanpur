"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/execution/code-editor";
import { IconSpinner } from "@/components/icons";
import { cn } from "@/lib/utils";
import { compareSqlResults } from "@/lib/grading";
import type {
  RunSummary,
  RuntimeProps,
  TestOutcome,
} from "@/components/execution/types";
import type { TestCase } from "@/lib/types";
import { usePhoneGate } from "@/components/phone/phone-gate";

interface QueryResult {
  columns: string[];
  rows: unknown[][];
  error?: string;
  affected?: number;
}

/** Just the bit of PGlite this file uses — the module is loaded at run time. */
interface PGliteDb {
  exec(sql: string): Promise<unknown>;
  query(
    sql: string,
    params: unknown[],
    options: { rowMode: "array" },
  ): Promise<{ fields?: { name: string }[]; rows?: unknown[][]; affectedRows?: number }>;
  close(): Promise<void>;
}

/** A result set as plain text, for the shared Test Cases panel. */
function asText(r: QueryResult): string {
  if (r.error) return r.error;
  if (!r.columns.length) return "(no rows)";
  const cell = (v: unknown) =>
    v === null || v === undefined
      ? "NULL"
      : v instanceof Date
        ? v.toISOString().slice(0, 10)
        : String(v);
  return [
    r.columns.join(" | "),
    ...r.rows.map((row) => row.map(cell).join(" | ")),
  ].join("\n");
}

/**
 * In-browser Postgres via PGlite. Each run creates a fresh database, applies the
 * question's setup_sql, then executes the learner's query and shows the result.
 * Loaded lazily so the WASM only ships when a SQL question is opened.
 */
export function SqlRuntime({
  question,
  onAnswerChange,
  initialAnswer,
  ide,
  onSqlOutcome,
  onCodeSubmit,
  onOutcomes,
  onSubmit,
}: RuntimeProps) {
  const gate = usePhoneGate();
  const [query, setQuery] = useState(initialAnswer ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [graded, setGraded] = useState<{
    passed: boolean;
    expected: QueryResult;
    got: QueryResult;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pgModuleRef = useRef<any>(null);

  useEffect(() => {
    onAnswerChange?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /**
   * One database per dataset, kept for as long as the question is open.
   *
   * Starting Postgres and replaying a schema and its rows costs a second or
   * more, and a check runs two queries over every dataset — so building a fresh
   * database each time made a single press take minutes. Each dataset is built
   * once and every query afterwards runs inside a transaction that is rolled
   * back, so a query that writes cannot leave anything behind and the next
   * check still sees the dataset exactly as authored.
   */
  const dbCache = useRef(new Map<string, Promise<PGliteDb>>());

  const databaseFor = useCallback(
    (setup?: string): Promise<PGliteDb> => {
      const seed = setup ?? question.setup_sql ?? "";
      const cached = dbCache.current.get(seed);
      if (cached) return cached;
      const opening = (async () => {
        if (!pgModuleRef.current) {
          // CDN import (self-contained WASM) — the bundled package's WASM does
          // not instantiate under Turbopack. turbopackIgnore keeps this a
          // runtime import.
          const cdn =
            "https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js";
          pgModuleRef.current = await import(/* turbopackIgnore: true */ cdn);
        }
        const db = new pgModuleRef.current.PGlite() as PGliteDb;
        if (seed) await db.exec(seed);
        return db;
      })();
      dbCache.current.set(seed, opening);
      return opening;
    },
    [question.setup_sql],
  );

  // Free the databases when the learner moves to another question.
  useEffect(() => {
    const cache = dbCache.current;
    return () => {
      for (const opening of cache.values())
        void opening.then((db) => db.close()).catch(() => {});
      cache.clear();
    };
  }, []);

  /**
   * The reference result for a dataset never changes, so it is computed once
   * and kept. Without this every check ran the reference query again alongside
   * the learner's, doubling the work for an answer already known.
   */
  const expectedCache = useRef(new Map<string, QueryResult>());

  const execFresh = useCallback(
    async (sql: string, setup?: string): Promise<QueryResult> => {
      const db = await databaseFor(setup);
      try {
        await db.exec("BEGIN");
        // rowMode "array" keeps the columns positional. Reading a row back by
        // column name silently collapses duplicates: "select t.name, m.name"
        // returns two columns both called name, an object row carries only one
        // of them, and the second column would grade against the first one's
        // value — failing a correct answer on any question that selects the
        // same column name from two tables.
        const res = await db.query(sql, [], { rowMode: "array" });
        const columns = (res.fields ?? []).map((f: { name: string }) => f.name);
        const rows = (res.rows ?? []) as unknown[][];
        return { columns, rows, affected: res.affectedRows };
      } catch (err) {
        return {
          columns: [],
          rows: [],
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        // Undo anything the statement wrote, including after an error.
        await db.exec("ROLLBACK").catch(() => {});
      }
    },
    [databaseFor],
  );

  const reference = question.reference_sql;

  /**
   * The datasets this question is checked against. A question that declares
   * none is still checked once, against its own setup — so a paper written
   * before datasets existed behaves exactly as it did.
   */
  const datasets = useMemo(() => {
    // Every case is a dataset. The visible one usually carries no setup of its
    // own and falls back to the question's database — filtering on setup here
    // dropped it, leaving the question with nothing but its hidden case and no
    // result to show.
    const declared = question.tests ?? [];
    if (declared.length) return declared;
    return [{ stdin: "", expected: "", hidden: false } as TestCase];
  }, [question.tests]);

  const publicCount = datasets.filter((t) => !t.hidden).length;
  const hiddenCount = datasets.filter((t) => t.hidden).length;

  /**
   * Build the databases and work out the expected rows while the learner is
   * still reading the question, so pressing a button doesn't wait for Postgres
   * to start. Errors are ignored here — whatever fails is retried on the press,
   * where it can be reported properly.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const t of datasets) {
        if (cancelled) return;
        try {
          await databaseFor(t.setup);
          if (cancelled || !reference) return;
          const key = t.setup ?? "";
          if (!expectedCache.current.has(key))
            expectedCache.current.set(key, await execFresh(reference, t.setup));
        } catch {
          /* retried on press */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [datasets, databaseFor, execFresh, reference]);

  /**
   * Check the query the same way a coding question is checked: run it over each
   * dataset, compare against the reference on that same dataset, and report
   * public and hidden totals. "run" checks only the datasets the learner can
   * see; "testrun" and "submit" check all of them.
   */
  const grade = useCallback(
    async (action: "run" | "testrun" | "submit") => {
      if (!reference) return;
      setRunning(true);
      setResult(null);
      setGraded(null);

      const runAll = action !== "run";
      const indexed = datasets.map((t, index) => ({ t, index }));
      const toRun = runAll ? indexed : indexed.filter((x) => !x.t.hidden);

      const results: TestOutcome[] = [];
      let firstShown: { got: QueryResult; expected: QueryResult } | null = null;

      for (const { t, index } of toRun) {
        const key = t.setup ?? "";
        let expected = expectedCache.current.get(key);
        if (!expected) {
          expected = await execFresh(reference, t.setup);
          expectedCache.current.set(key, expected);
        }
        const got = await execFresh(query, t.setup);
        // Row order only counts when the reference query asks for one; column
        // names never count. See compareSqlResults for why.
        const passed = compareSqlResults(got, expected, reference);
        if (!t.hidden && !firstShown) firstShown = { got, expected };
        results.push({
          index,
          hidden: !!t.hidden,
          passed,
          // The panel is written for programs, so the dataset and the rows are
          // rendered as text: a hidden dataset must never show its contents,
          // only that it was checked.
          stdin: t.hidden ? "" : "the data shown in the question",
          expected: t.hidden ? "" : asText(expected),
          got: t.hidden ? "" : asText(got),
          stderr: got.error ?? "",
        });
      }

      const publicTotal = indexed.filter((x) => !x.t.hidden).length;
      const privateTotal = indexed.filter((x) => x.t.hidden).length;
      const publicPassed = results.filter((r) => !r.hidden && r.passed).length;
      const privatePassed = runAll
        ? results.filter((r) => r.hidden && r.passed).length
        : null;
      const solved =
        runAll &&
        publicPassed === publicTotal &&
        (privatePassed ?? 0) === privateTotal;

      const summary: RunSummary = {
        action: action === "run" ? "run" : "submit",
        publicPassed,
        publicTotal,
        privatePassed,
        privateTotal,
        solved,
        results,
      };
      onOutcomes?.(summary);

      // Keep showing the rows for the visible dataset — seeing what a query
      // returned is most of how you debug one.
      if (firstShown) {
        if (onSqlOutcome)
          onSqlOutcome({
            mode: "submit",
            result: firstShown.got,
            expected: firstShown.expected,
            passed: compareSqlResults(firstShown.got, firstShown.expected, reference),
          });
        else
          setGraded({
            passed: compareSqlResults(firstShown.got, firstShown.expected, reference),
            expected: firstShown.expected,
            got: firstShown.got,
          });
      }

      if (action === "submit") {
        onSubmit?.(summary);
        onCodeSubmit?.(query);
      }
      setRunning(false);
    },
    [
      execFresh,
      query,
      reference,
      datasets,
      onSqlOutcome,
      onCodeSubmit,
      onOutcomes,
      onSubmit,
    ],
  );

  const queryTable = (qr: QueryResult) =>
    qr.error ? (
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px] text-err">
        {qr.error}
      </pre>
    ) : qr.columns.length === 0 ? (
      <p className="p-3 text-[13px] text-fg-muted">
        Statement ran{" "}
        {qr.affected != null ? `(${qr.affected} rows affected)` : ""}. No rows
        returned.
      </p>
    ) : (
      <div className="max-h-52 overflow-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-hairline">
              {qr.columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap px-3 py-2 text-[12px] font-medium tracking-[0.02em] text-fg-muted"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qr.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-hairline last:border-0">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="whitespace-nowrap px-3 py-2 font-mono text-[12px]"
                  >
                    {cell === null ? "NULL" : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const resultView = result && (
    <div className="overflow-hidden rounded-md border border-hairline">
      {queryTable(result)}
    </div>
  );

  const gradedView = graded && (
    <div className="space-y-2.5">
      <div
        className={cn(
          "rounded-md border px-3 py-2 text-[13px] font-medium",
          graded.passed
            ? "border-ok/40 bg-ok-weak text-ok"
            : "border-err/40 bg-err-weak text-err",
        )}
      >
        {graded.passed
          ? "Correct — your result matches the expected output."
          : "Not matching — your result differs from the expected output."}
      </div>
      {!graded.passed && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] text-fg-muted">Expected</div>
            <div className="overflow-hidden rounded-md border border-hairline">
              {queryTable(graded.expected)}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-fg-muted">Your result</div>
            <div className="overflow-hidden rounded-md border border-hairline">
              {queryTable(graded.got)}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // The same actions, and the same words, a coding question uses: check every
  // case without submitting, then submit. There is no separate "run this
  // query" — checking a case already runs it and shows what it returned.
  const testRunButton = reference && (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => gate.requirePhone(() => grade(ide ? "testrun" : "run"))}
      disabled={running || !query.trim()}
      title={
        ide
          ? "Runs every case so you can check your query — nothing is submitted."
          : `Runs the ${publicCount} sample ${publicCount === 1 ? "case" : "cases"} you can see.`
      }
    >
      {/* A spinner on the button that was pressed, so the click is visibly
          registered while the check runs. Both buttons grey out, so it is also
          clear that nothing else can be pressed meanwhile. */}
      {running && <IconSpinner size={14} />}
      {running ? "Running…" : ide ? "Test run" : "Run code"}
    </Button>
  );
  const submitButton = reference && (
    <Button
      variant="primary"
      size="sm"
      onClick={() => gate.requirePhone(() => grade("submit"))}
      disabled={running || !query.trim()}
      title={`Runs all ${publicCount + hiddenCount} cases (including hidden ones) and records your attempt.`}
    >
      {running && <IconSpinner size={14} />}
      {running ? "Checking…" : "Submit"}
    </Button>
  );

  // IDE layout — full-height editor + bottom action bar, matching the code
  // editor so the frame is identical across subjects.
  if (ide) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="min-h-0 flex-1">
          <CodeEditor
            value={query}
            onChange={setQuery}
            ariaLabel="SQL query"
            language="sql"
            placeholder="SELECT ..."
            fill
          />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {testRunButton}
          {submitButton}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CodeEditor
        value={query}
        onChange={setQuery}
        ariaLabel="SQL query"
            language="sql"
        minRows={6}
        placeholder="SELECT ..."
      />
      <div className="flex items-center gap-2">
        {testRunButton}
        {submitButton}
      </div>
      {gradedView}
      {resultView}
    </div>
  );
}
