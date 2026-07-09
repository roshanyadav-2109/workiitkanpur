import type { TestCase } from "@/lib/types";

/** Judge normalisation: unify newlines, strip trailing whitespace per line and
 *  trailing blank lines. Student output is compared to expected after this. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

export interface TestOutcome {
  index: number;
  passed: boolean;
  hidden: boolean;
  stdin: string;
  expected: string;
  got: string;
  stderr: string;
}

export function gradeOutput(test: TestCase, stdout: string): boolean {
  return normalizeOutput(stdout) === normalizeOutput(test.expected);
}
