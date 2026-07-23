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
          {ran ? `${passed}/${total} passed` : `${total} tests, run when you submit`}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="bg-ok" style={{ width: `${passPct}%` }} />
        <div className="bg-err" style={{ width: `${failPct}%` }} />
      </div>
    </div>
  );
}

/**
 * One cell, as Postgres would print it.
 *
 * The driver hands back real JavaScript values, so a date arrives as a Date and
 * stringifies to "Sat Jul 05 1997 05:30:00 GMT+0530 (India Standard Time)" —
 * which is not what any database shows, and makes a correct answer look wrong
 * next to the expected output.
 */
function formatCell(cell: unknown): string {
  if (cell === null || cell === undefined) return "NULL";
  if (cell instanceof Date) {
    const iso = cell.toISOString();
    // Midnight UTC means it came from a date column, not a timestamp.
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace("T", " ").slice(0, 19);
  }
  if (typeof cell === "boolean") return cell ? "true" : "false";
  if (typeof cell === "object") return JSON.stringify(cell);
  return String(cell);
}

/** A SQL result rendered as a table (or its error / empty note). */
function SqlTable({ data }: { data: SqlResultData }) {
  // The border marks it as an error; the message itself stays readable text.
  if (data.error) {
    return (
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-[3px] border border-err/40 bg-canvas p-3 font-mono text-[12px] text-fg">
        {data.error}
      </pre>
    );
  }
  if (data.columns.length === 0) {
    return (
      <p className="rounded-[3px] border border-hairline p-3 text-[13px] text-fg-muted">
        Query ran successfully
        {data.affected != null ? ` (${data.affected} rows affected)` : ""} — it
        returned no rows.
      </p>
    );
  }
  return (
    <div className="max-h-52 overflow-auto rounded-[3px] border border-hairline">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            {/* Keyed by position, not by name: a join can select the same
                column name from several tables, and "select t.name, m.name"
                would otherwise give two children the same key. */}
            {data.columns.map((c, ci) => (
              <th
                key={ci}
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
                  {formatCell(cell)}
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
      {/* The same meter a coding question shows. A query is one check — its
          result either matches the expected rows or it doesn't — so the bar
          fills once, but it reads the same way across every kind of question. */}
      {mode === "submit" && (
        <div className="rounded-[3px] border border-hairline p-3">
          <ProgressLine
            label="Expected output"
            passed={passed ? 1 : 0}
            total={1}
            ran
          />
        </div>
      )}
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
  // Keep each test's real position, so "Test 3" means the third test whether or
  // not the ones before it are hidden — the same numbering the results use.
  const publicTests = tests
    .map((t, index) => ({ t, index }))
    .filter((x) => !x.t.hidden);
  const privateCount = tests.filter((t) => t.hidden).length;

  const byIndex = new Map((summary?.results ?? []).map((r) => [r.index, r]));
  // A hidden test that fails moves its meter and says nothing else: naming it,
  // counting them, or showing its error tells the learner about tests they are
  // not meant to see.
  const allPassed = !!summary && summary.results.every((r) => r.passed);

  return (
    <div className="space-y-4">
      {summary && (
        <div className="space-y-2.5 rounded-[3px] border border-hairline p-3">
          <ProgressLine
            label="Sample tests"
            passed={summary.publicPassed}
            total={summary.publicTotal}
            ran
          />
          <ProgressLine
            label="Hidden tests"
            passed={summary.privatePassed ?? 0}
            total={summary.privateTotal}
            ran={summary.privatePassed !== null}
          />
        </div>
      )}

      {/* No banner naming what failed: the meter has already moved and the test
          itself is marked failed in red below. Saying it a third time is noise
          on the one screen a learner is reading under time pressure. */}
      {summary && allPassed && (
        <div className="rounded-[3px] border border-ok/40 bg-ok-weak px-3 py-2.5 text-[13px] font-medium text-ok">
          {/* A Run only executes the sample tests, so it cannot claim the
              hidden ones passed. */}
          {summary.action === "run"
            ? `All ${summary.results.length} sample tests passed.`
            : `All ${summary.results.length} tests passed.`}
        </div>
      )}

      {tests.length === 0 ? (
        <p className="text-[13px] text-fg">No test cases for this question.</p>
      ) : (
        <div className="space-y-3">
          {publicTests.map(({ t, index }) => {
            const outcome = byIndex.get(index);
            const failed = outcome ? !outcome.passed : false;
            return (
              <div
                key={index}
                className={cn(
                  "overflow-hidden rounded-[3px] border",
                  failed
                    ? "border-err/40 bg-err-weak"
                    : outcome
                      ? "border-ok/40"
                      : "border-hairline",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 border-b px-3 py-1.5 text-[12px] font-medium",
                    failed
                      ? "border-err/40 text-err"
                      : outcome
                        ? "border-ok/40 text-ok"
                        : "border-hairline text-fg",
                  )}
                >
                  <span>Test {index + 1}</span>
                  {outcome && <span>{failed ? "Failed" : "Passed"}</span>}
                </div>
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] text-fg-muted">Input</div>
                    <pre className="whitespace-pre-wrap rounded border border-hairline bg-canvas p-2 font-mono text-[12px] text-fg">
                      {t.stdin || "—"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] text-fg-muted">
                      Expected
                    </div>
                    <pre className="whitespace-pre-wrap rounded border border-hairline bg-canvas p-2 font-mono text-[12px] text-fg">
                      {t.expected || "—"}
                    </pre>
                  </div>
                </div>
                {/* What this specific test actually produced, in place, so the
                    comparison does not require scrolling elsewhere. */}
                {failed && outcome && (
                  <div className="px-3 pb-3">
                    <div className="mb-1 text-[11px] text-fg-muted">
                      {outcome.stderr ? "Error" : "Your output"}
                    </div>
                    {/* The error text reads as text. The red border already
                        says this failed; colouring the message too makes a
                        stack trace harder to read, not easier. */}
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded border border-err/40 bg-canvas p-2 font-mono text-[12px] text-fg">
                      {outcome.stderr || outcome.got || "(no output)"}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
          {privateCount > 0 && (
            <p className="text-[13px] text-fg-muted">
              Plus {privateCount} hidden {privateCount === 1 ? "test" : "tests"}{" "}
              that run when you test or submit.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
