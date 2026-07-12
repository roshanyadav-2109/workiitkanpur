import { cn } from "@/lib/utils";
import type {
  RunSummary,
  SqlOutcome,
  SqlResultData,
} from "@/components/execution/types";
import type { TestCase } from "@/lib/types";

/** A pass/fail line: green for passed, red for failed, on a neutral track. */
export function ProgressLine({
  label,
  passed,
  total,
  ran,
}: {
  label: string;
  passed: number;
  total: number;
  ran: boolean;
}) {
  const passPct = total ? (passed / total) * 100 : 0;
  const failPct = ran && total ? ((total - passed) / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-fg">{label}</span>
        <span className="tnum text-fg-muted">
          {ran ? `${passed}/${total} passed` : `${total} — run on submit`}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="bg-ok" style={{ width: `${passPct}%` }} />
        <div className="bg-err" style={{ width: `${failPct}%` }} />
      </div>
    </div>
  );
}

/** A SQL result rendered as a table (or its error / empty note). */
function SqlTable({ data }: { data: SqlResultData }) {
  if (data.error) {
    return (
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-[3px] border border-err/40 bg-err-weak p-3 font-mono text-[12px] text-err">
        {data.error}
      </pre>
    );
  }
  if (data.columns.length === 0) {
    return (
      <p className="rounded-[3px] border border-hairline p-3 text-[13px] text-fg-muted">
        Statement ran
        {data.affected != null ? ` (${data.affected} rows affected)` : ""}. No
        rows returned.
      </p>
    );
  }
  return (
    <div className="max-h-52 overflow-auto rounded-[3px] border border-hairline">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            {data.columns.map((c) => (
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
          {data.rows.map((row, ri) => (
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
}

/** The Test Cases panel for SQL — run result, or Submit's pass/fail + expected. */
export function SqlResultPanel({ outcome }: { outcome: SqlOutcome | null }) {
  if (!outcome) {
    return (
      <p className="text-[13px] text-fg-muted">
        Run your query to see its result here, or press{" "}
        <span className="font-medium text-fg">Submit</span> to check it against
        the expected output.
      </p>
    );
  }
  const { mode, result, expected, passed } = outcome;
  return (
    <div className="space-y-4">
      {mode === "submit" && (
        <div
          className={cn(
            "rounded-[3px] border px-3 py-2.5 text-[13px] font-medium",
            passed
              ? "border-ok/40 bg-ok-weak text-ok"
              : "border-err/40 bg-err-weak text-err",
          )}
        >
          {passed
            ? "Correct — your result matches the expected output."
            : "Not matching — your result differs from the expected output."}
        </div>
      )}
      {mode === "submit" && !passed && expected ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] text-fg-muted">Expected</div>
            <SqlTable data={expected} />
          </div>
          <div>
            <div className="mb-1 text-[11px] text-fg-muted">Your result</div>
            <SqlTable data={result} />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1 text-[11px] text-fg-muted">
            {mode === "run" ? "Result" : "Your result"}
          </div>
          <SqlTable data={result} />
        </div>
      )}
    </div>
  );
}

/**
 * The Test Cases panel: public tests (Input/Expected), a private-tests note,
 * and — once a run/submit has happened — the pass/fail rating plus a single
 * output/error box. Shared by the practice IDE and the exam runner.
 */
export function TestCasesPanel({
  tests,
  summary,
}: {
  tests: TestCase[];
  summary: RunSummary | null;
}) {
  const publicTests = tests.filter((t) => !t.hidden);
  const privateCount = tests.filter((t) => t.hidden).length;

  const fail = summary?.results.find((r) => !r.passed);
  const shown = fail ?? summary?.results[0];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="space-y-2.5 rounded-[3px] border border-hairline p-3">
          <ProgressLine
            label="Public tests"
            passed={summary.publicPassed}
            total={summary.publicTotal}
            ran
          />
          <ProgressLine
            label="Private tests"
            passed={summary.privatePassed ?? 0}
            total={summary.privateTotal}
            ran={summary.privatePassed !== null}
          />
        </div>
      )}

      {tests.length === 0 ? (
        <p className="text-[13px] text-fg">No test cases for this question.</p>
      ) : (
        <div className="space-y-3">
          {publicTests.map((t, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[3px] border border-hairline"
            >
              <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg">
                Test {i + 1}
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-[11px] text-fg-muted">Input</div>
                  <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                    {t.stdin || "—"}
                  </pre>
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-fg-muted">Expected</div>
                  <pre className="whitespace-pre-wrap rounded border border-hairline bg-surface p-2 font-mono text-[12px] text-fg">
                    {t.expected || "—"}
                  </pre>
                </div>
              </div>
            </div>
          ))}
          {privateCount > 0 && (
            <p className="text-[13px] text-fg-muted">
              + {privateCount} private {privateCount === 1 ? "test" : "tests"}{" "}
              run on Test Run and Submit.
            </p>
          )}
        </div>
      )}

      {summary &&
        shown &&
        (() => {
          const title = fail
            ? fail.stderr
              ? "Error"
              : "Your output (did not match)"
            : "Your output";
          const body = fail
            ? fail.stderr || fail.got || "(no output)"
            : shown.got || "(no output)";
          return (
            <div className="overflow-hidden rounded-[3px] border border-hairline">
              <div className="border-b border-hairline px-3 py-1.5 text-[12px] font-medium text-fg">
                {title}
              </div>
              <pre
                className={cn(
                  "max-h-56 overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px]",
                  fail && fail.stderr ? "text-err" : "text-fg",
                )}
              >
                {body}
              </pre>
            </div>
          );
        })()}
    </div>
  );
}
