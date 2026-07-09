"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/execution/code-editor";
import { IconPlay } from "@/components/icons";
import type { RuntimeProps } from "@/components/execution/types";

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
}: RuntimeProps) {
  const [query, setQuery] = useState(initialAnswer ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pgModuleRef = useRef<any>(null);

  useEffect(() => {
    onAnswerChange?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const run = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      if (!pgModuleRef.current) {
        setLoading(true);
        // Load from CDN (self-contained WASM) rather than the bundled package,
        // whose WASM asset does not instantiate under Turbopack. turbopackIgnore
        // leaves this as a native runtime import.
        const cdn =
          "https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js";
        pgModuleRef.current = await import(/* turbopackIgnore: true */ cdn);
        setLoading(false);
      }
      const { PGlite } = pgModuleRef.current;
      const db = new PGlite();
      if (question.setup_sql) await db.exec(question.setup_sql);
      const res = await db.query(query);
      const columns = (res.fields ?? []).map(
        (f: { name: string }) => f.name,
      );
      const rows = (res.rows ?? []).map((r: Record<string, unknown>) =>
        columns.map((c: string) => r[c]),
      );
      setResult({ columns, rows, affected: res.affectedRows });
      await db.close();
    } catch (err) {
      setResult({
        columns: [],
        rows: [],
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, [query, question.setup_sql]);

  return (
    <div className="space-y-3">
      <CodeEditor
        value={query}
        onChange={setQuery}
        ariaLabel="SQL query"
        minRows={6}
        placeholder="SELECT ..."
      />
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={run}
          disabled={running || !query.trim()}
        >
          <IconPlay size={15} />
          {running ? "Running…" : "Run query"}
        </Button>
        {loading && (
          <span className="text-[12px] text-fg-muted">
            Loading Postgres (WASM)…
          </span>
        )}
      </div>

      {result && (
        <div className="rounded-md border border-hairline">
          {result.error ? (
            <pre className="overflow-x-auto whitespace-pre-wrap p-3 font-mono text-[12px] text-fg-muted">
              {result.error}
            </pre>
          ) : result.columns.length === 0 ? (
            <p className="p-3 text-[13px] text-fg-muted">
              Statement ran{" "}
              {result.affected != null ? `(${result.affected} rows affected)` : ""}
              . No rows returned.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-hairline">
                    {result.columns.map((c) => (
                      <th
                        key={c}
                        className="px-3 py-2 font-medium text-[12px] tracking-[0.02em] text-fg-muted whitespace-nowrap"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-hairline last:border-0"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2 font-mono text-[12px] whitespace-nowrap"
                        >
                          {cell === null ? "NULL" : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
