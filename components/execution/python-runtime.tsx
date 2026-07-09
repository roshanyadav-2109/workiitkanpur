"use client";

import { useEffect, useRef, useState } from "react";
import { usePythonRunner } from "@/lib/python-runner";
import { gradeOutput, normalizeOutput } from "@/lib/grading";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/execution/code-editor";
import { IconPlay, IconCheck, IconClose } from "@/components/icons";
import type { RuntimeProps } from "@/components/execution/types";

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
}: RuntimeProps) {
  const storageKey = `oppe:code:${question.id}`;
  const runner = usePythonRunner();
  const [code, setCode] = useState(initialAnswer ?? "");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runOut, setRunOut] = useState<{
    stdout: string;
    stderr: string;
    timedOut?: boolean;
  } | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const ready = useRef(false);

  // Load persisted code (practice) or the provided initial answer (exam).
  useEffect(() => {
    if (mode === "exam") {
      setCode(initialAnswer ?? STARTER);
    } else {
      try {
        setCode(localStorage.getItem(storageKey) ?? STARTER);
      } catch {
        setCode(STARTER);
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
    const res = await runner.run(code, stdin);
    setRunOut({ stdout: res.stdout, stderr: res.stderr, timedOut: res.timedOut });
    setRunning(false);
  }

  async function onRunTests() {
    setTesting(true);
    setOutcomes(null);
    const results: Outcome[] = [];
    for (let i = 0; i < question.tests.length; i++) {
      const t = question.tests[i];
      const res = await runner.run(code, t.stdin);
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

  const loading = runner.status === "loading";
  const passedCount = outcomes?.filter((o) => o.passed).length ?? 0;
  const allPassed = outcomes && passedCount === outcomes.length;

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
          onClick={onRun}
          disabled={running || testing}
        >
          <IconPlay size={15} />
          {running ? "Running…" : "Run"}
        </Button>
        {mode === "practice" && question.tests.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRunTests}
            disabled={running || testing}
          >
            {testing
              ? "Running tests…"
              : `Run tests (${question.tests.length})`}
          </Button>
        )}
        {loading && (
          <span className="text-[12px] text-fg-muted">
            Loading Python — first run downloads ~10 MB…
          </span>
        )}
      </div>

      {/* Custom-input run */}
      <details className="rounded-md border border-hairline">
        <summary className="cursor-pointer px-3 py-2 text-[13px] text-fg-muted">
          Custom input (stdin)
        </summary>
        <div className="border-t border-hairline p-3">
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Type input the program should read"
            className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 font-mono text-[13px] resize-y focus:outline-none focus-visible:border-accent"
            rows={3}
            aria-label="Standard input"
          />
        </div>
      </details>

      {runOut && (
        <div className="rounded-md border border-hairline">
          <div className="border-b border-hairline px-3 py-2 text-[12px] font-medium uppercase tracking-[0.04em] text-fg-muted">
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
              <li key={o.index} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {o.passed ? (
                    <IconCheck size={15} className="text-accent" />
                  ) : (
                    <IconClose size={15} className="text-fg-muted" />
                  )}
                  <span className="text-[13px] font-medium">
                    {o.hidden ? `Hidden test ${o.index + 1}` : `Test ${o.index + 1}`}
                  </span>
                  <span
                    className={cn(
                      "text-[12px]",
                      o.passed ? "text-accent" : "text-fg-muted",
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
      <div className="mb-1 text-[11px] uppercase tracking-[0.04em] text-fg-faint">
        {label}
      </div>
      <pre className="max-h-28 overflow-auto rounded border border-hairline bg-surface p-2 font-mono text-[12px] whitespace-pre-wrap">
        {text || "—"}
      </pre>
    </div>
  );
}
