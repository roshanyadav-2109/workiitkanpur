"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/execution/code-editor";
import { IconPlay } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { RuntimeProps } from "@/components/execution/types";
import { usePhoneGate } from "@/components/phone/phone-gate";

interface QueryResult {
  columns: string[];
  rows: unknown[][];
  error?: string;
  affected?: number;
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
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pgModuleRef = useRef<any>(null);

  useEffect(() => {
    onAnswerChange?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Run a statement against a fresh database seeded with the question's setup.
  const execFresh = useCallback(
    async (sql: string): Promise<QueryResult> => {
      if (!pgModuleRef.current) {
        setLoading(true);
        // CDN import (self-contained WASM) — the bundled package's WASM does not
        // instantiate under Turbopack. turbopackIgnore keeps this a runtime import.
        const cdn =
          "https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js";
        pgModuleRef.current = await import(/* turbopackIgnore: true */ cdn);
        setLoading(false);
      }
      const { PGlite } = pgModuleRef.current;
      const db = new PGlite();
      try {
        if (question.setup_sql) await db.exec(question.setup_sql);
        const res = await db.query(sql);
        const columns = (res.fields ?? []).map((f: { name: string }) => f.name);
        const rows = (res.rows ?? []).map((r: Record<string, unknown>) =>
          columns.map((c: string) => r[c]),
        );
        return { columns, rows, affected: res.affectedRows };
      } catch (err) {
        return {
          columns: [],
          rows: [],
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        await db.close();
      }
    },
    [question.setup_sql],
  );

  const run = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setGraded(null);
    const r = await execFresh(query);
    // In the IDE, results live in the host's Test Cases panel (like Python).
    if (onSqlOutcome) onSqlOutcome({ mode: "run", result: r });
    else setResult(r);
    setRunning(false);
  }, [execFresh, query, onSqlOutcome]);

  // Grade by comparing the learner's result to the reference query's result.
  const reference = question.reference_sql;
  const grade = useCallback(async () => {
    if (!reference) return;
    setRunning(true);
    setResult(null);
    setGraded(null);
    const got = await execFresh(query);
    const expected = await execFresh(reference);
    const passed =
      !got.error &&
      !expected.error &&
      JSON.stringify(got.columns) === JSON.stringify(expected.columns) &&
      JSON.stringify(got.rows) === JSON.stringify(expected.rows);
    if (onSqlOutcome)
      onSqlOutcome({ mode: "submit", result: got, expected, passed });
    else setGraded({ passed, expected, got });
    onCodeSubmit?.(query);
    setRunning(false);
  }, [execFresh, query, reference, onSqlOutcome, onCodeSubmit]);

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

  const runButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => gate.requirePhone(run)}
      disabled={running || !query.trim()}
    >
      <IconPlay size={15} />
      {running ? "Running…" : "Run query"}
    </Button>
  );
  const submitButton = reference && (
    <Button
      variant="primary"
      size="sm"
      onClick={() => gate.requirePhone(grade)}
      disabled={running || !query.trim()}
    >
      {running ? "Checking…" : "Submit"}
    </Button>
  );
  const loadingNote = loading && (
    <span className="text-[12px] text-fg-muted">Setting up the editor…</span>
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
          {loadingNote}
          {runButton}
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
        {runButton}
        {submitButton}
        {loadingNote}
      </div>
      {gradedView}
      {resultView}
    </div>
  );
}
