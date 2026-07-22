"use client";

import { useEffect, useRef, useState } from "react";
import { usePythonRunner } from "@/lib/python-runner";
import { gradeOutput, normalizeOutput } from "@/lib/grading";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/execution/code-editor";
import { IconPlay, IconCheck, IconClose } from "@/components/icons";
import type { RuntimeProps } from "@/components/execution/types";
import { usePhoneGate } from "@/components/phone/phone-gate";

interface Outcome {
  index: number;
  hidden: boolean;
  passed: boolean;
  stdin: string;
  expected: string;
  got: string;
  stderr: string;
}

const STARTER = "# Read input with input(); print your answer.\n";

export function PythonRuntime({
  question,
  mode,
  onAnswerChange,
  onGraded,
  initialAnswer,
  stdin: stdinProp,
  onStdinChange,
  ide,
  onOutcomes,
  onRunOutput,
  exam,
  onSubmit,
  onCodeSubmit,
}: RuntimeProps) {
  const storageKey = `oppe:code:${question.id}`;
  const runner = usePythonRunner();
  const gate = usePhoneGate();
  const [code, setCode] = useState(initialAnswer ?? "");
  const [stdinInternal, setStdinInternal] = useState("");
  // When the host supplies its own custom-input UI, stdin is controlled.
  const controlledStdin = onStdinChange !== undefined;
  const stdin = controlledStdin ? (stdinProp ?? "") : stdinInternal;
  const setStdin = onStdinChange ?? setStdinInternal;
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runOut, setRunOut] = useState<{
    stdout: string;
    stderr: string;
    timedOut?: boolean;
  } | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const ready = useRef(false);

  // The question's own boilerplate (a def skeleton / hint) seeds the editor when
  // there's nothing saved yet; otherwise a generic starter comment.
  const starter = question.starter_code || STARTER;

  // "Write this function" questions print nothing on their own, so a hidden
  // driver is appended before running: it reads the arguments from stdin and
  // prints the return value. Questions without a harness run exactly as typed.
  const withHarness = (src: string) =>
    question.harness ? `${src}\n\n${question.harness}\n` : src;

  // Load persisted code (practice) or the provided initial answer (exam).
  useEffect(() => {
    if (mode === "exam") {
      setCode(initialAnswer ?? starter);
    } else {
      try {
        setCode(localStorage.getItem(storageKey) ?? starter);
      } catch {
        setCode(starter);
      }
    }
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, mode]);

  // Pre-warm Pyodide so the first Run is responsive (init is un-timed).
  useEffect(() => {
    runner.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    if (mode === "practice") {
      try {
        localStorage.setItem(storageKey, code);
      } catch {
        /* ignore */
      }
    }
    onAnswerChange?.(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function onRun() {
    setRunning(true);
    setRunOut(null);
    onRunOutput?.(null);
    const res = await runner.run(withHarness(code), stdin);
    const out = { stdout: res.stdout, stderr: res.stderr, timedOut: res.timedOut };
    setRunOut(out);
    onRunOutput?.(out);
    setRunning(false);
  }

  async function onRunTests() {
    setTesting(true);
    setOutcomes(null);
    const results: Outcome[] = [];
    for (let i = 0; i < question.tests.length; i++) {
      const t = question.tests[i];
      const res = await runner.run(withHarness(code), t.stdin);
      const passed = res.ok && gradeOutput(t, res.stdout);
      results.push({
        index: i,
        hidden: !!t.hidden,
        passed,
        stdin: t.stdin,
        expected: normalizeOutput(t.expected),
        got: normalizeOutput(res.stdout),
        stderr: res.stderr,
      });
    }
    setOutcomes(results);
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    onGraded?.({ correct: total > 0 && passed === total, passed, total });
    setTesting(false);
  }

  // IDE flow: Run checks public (visible) tests; Submit checks private (hidden)
  // tests. Results are bubbled up to the host's Test Cases panel.
  async function runGraded(action: "run" | "testrun" | "submit") {
    setTesting(true);
    // "run" checks public only; "testrun"/"submit" check everything.
    const runAll = action !== "run";
    const indexed = question.tests.map((t, index) => ({ t, index }));
    const toRun = runAll ? indexed : indexed.filter((x) => !x.t.hidden);
    const results: Outcome[] = [];
    for (const { t, index } of toRun) {
      const res = await runner.run(withHarness(code), t.stdin);
      const passed = res.ok && gradeOutput(t, res.stdout);
      results.push({
        index,
        hidden: !!t.hidden,
        passed,
        stdin: t.stdin,
        expected: normalizeOutput(t.expected),
        got: normalizeOutput(res.stdout),
        stderr: res.stderr,
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
      question.tests.length > 0 &&
      publicPassed === publicTotal &&
      (privatePassed ?? 0) === privateTotal;

    const summary = {
      action: (action === "run" ? "run" : "submit") as "run" | "submit",
      publicPassed,
      publicTotal,
      privatePassed,
      privateTotal,
      solved,
      results,
    };
    onOutcomes?.(summary);
    if (action === "submit") {
      onGraded?.({
        correct: solved,
        passed: publicPassed + (privatePassed ?? 0),
        total: question.tests.length,
      });
      onSubmit?.(summary);
      onCodeSubmit?.(code);
    }
    setTesting(false);
  }

  const loading = runner.status === "loading";
  const passedCount = outcomes?.filter((o) => o.passed).length ?? 0;
  const allPassed = outcomes && passedCount === outcomes.length;

  if (ide) {
    const visibleCount = question.tests.filter((t) => !t.hidden).length;
    const hiddenCount = question.tests.filter((t) => t.hidden).length;
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="min-h-0 flex-1">
          <CodeEditor
            value={code}
            onChange={setCode}
            ariaLabel="Python code"
            placeholder="# Your Python solution"
            fill
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {loading && (
            <span className="mr-auto text-[12px] text-fg-muted">
              Setting up the editor…
            </span>
          )}
          {exam ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runGraded("testrun")}
                disabled={running || testing}
                title="Runs every test so you can check your code — nothing is submitted."
              >
                <IconPlay size={15} />
                {testing ? "Running…" : "Test run"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => runGraded("submit")}
                disabled={running || testing}
              >
                {testing ? "Submitting…" : "Submit"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => gate.requirePhone(onRun)}
                disabled={running || testing}
                title="Run your code against the custom input"
              >
                <IconPlay size={15} />
                {running ? "Running…" : "Run code"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => gate.requirePhone(() => runGraded("run"))}
                disabled={running || testing || visibleCount === 0}
                title={`Runs the ${visibleCount} sample tests you can see.`}
              >
                {testing ? "Running…" : "Run sample tests"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => gate.requirePhone(() => runGraded("submit"))}
                disabled={running || testing}
                title={`Runs all ${visibleCount + hiddenCount} tests (including hidden ones) and records your attempt.`}
              >
                {testing ? "Checking…" : "Submit"}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CodeEditor
        value={code}
        onChange={setCode}
        ariaLabel="Python code"
        minRows={mode === "exam" ? 12 : 10}
        placeholder="# Your Python solution"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => gate.requirePhone(onRun)}
          disabled={running || testing}
        >
          <IconPlay size={15} />
          {running ? "Running…" : "Run"}
        </Button>
        {mode === "practice" && question.tests.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => gate.requirePhone(onRunTests)}
            disabled={running || testing}
          >
            {testing
              ? "Running tests…"
              : `Run tests (${question.tests.length})`}
          </Button>
        )}
        {loading && (
          <span className="text-[12px] text-fg-muted">
            Setting up the editor…
          </span>
        )}
      </div>

      {/* Custom-input run — hidden when the host owns the input UI (IDE). */}
      {!controlledStdin && (
        <details className="rounded-md border border-hairline">
          <summary className="cursor-pointer px-3 py-2 text-[13px] text-fg-muted">
            Custom input (stdin)
          </summary>
          <div className="border-t border-hairline p-3">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter the input your program should read"
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] resize-y focus:outline-none focus-visible:border-accent"
              rows={3}
              aria-label="Standard input"
            />
          </div>
        </details>
      )}

      {runOut && (
        <div className="rounded-md border border-hairline">
          <div className="border-b border-hairline px-3 py-2 text-[12px] font-medium text-fg">
            Output
          </div>
          <div className="p-3">
            {runOut.stdout && (
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px] text-fg">
                {runOut.stdout}
              </pre>
            )}
            {runOut.stderr && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-fg-muted">
                {runOut.stderr}
              </pre>
            )}
            {!runOut.stdout && !runOut.stderr && (
              <p className="text-[13px] text-fg-muted">
                (no output)
              </p>
            )}
          </div>
        </div>
      )}

      {outcomes && (
        <div className="rounded-md border border-hairline">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-[13px] font-medium">
              Passed{" "}
              <span className={cn("tnum", allPassed && "text-accent")}>
                {passedCount}/{outcomes.length}
              </span>{" "}
              tests
            </span>
            {allPassed && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-accent">
                <IconCheck size={16} /> All passing
              </span>
            )}
          </div>
          <ul className="divide-y divide-hairline">
            {outcomes.map((o) => (
              <li
                key={o.index}
                className={cn("px-3 py-2.5", !o.passed && "bg-err-weak")}
              >
                <div className="flex items-center gap-2">
                  {o.passed ? (
                    <IconCheck size={15} className="text-accent" />
                  ) : (
                    <IconClose size={15} className="text-err" />
                  )}
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      !o.passed && "text-err",
                    )}
                  >
                    {o.hidden ? `Hidden test ${o.index + 1}` : `Test ${o.index + 1}`}
                  </span>
                  <span
                    className={cn(
                      "text-[12px]",
                      o.passed ? "text-accent" : "text-err",
                    )}
                  >
                    {o.passed ? "passed" : "failed"}
                  </span>
                </div>
                {!o.hidden && !o.passed && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Snippet label="Input" text={o.stdin} />
                    <Snippet label="Expected" text={o.expected} />
                    <Snippet label="Got" text={o.stderr ? o.stderr : o.got} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Snippet({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-fg-muted">{label}</div>
      <pre className="max-h-28 overflow-auto rounded border border-hairline bg-surface p-2 font-mono text-[12px] whitespace-pre-wrap">
        {text || "—"}
      </pre>
    </div>
  );
}
