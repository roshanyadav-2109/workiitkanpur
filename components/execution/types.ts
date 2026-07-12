import type { Question } from "@/lib/types";

export type RuntimeMode = "practice" | "exam";

export interface GradeResult {
  correct: boolean;
  passed: number;
  total: number;
}

/** One test case's result after a Run/Submit. */
export interface TestOutcome {
  index: number;
  hidden: boolean;
  passed: boolean;
  stdin: string;
  expected: string;
  got: string;
  stderr: string;
}

/** Result of a Run (public tests) or Submit (private/all tests) in the IDE. */
export interface RunSummary {
  action: "run" | "submit";
  publicPassed: number;
  publicTotal: number;
  /** null until Submit runs the private tests. */
  privatePassed: number | null;
  privateTotal: number;
  solved: boolean;
  /** Per-test outcomes produced by this action (public always; private on submit). */
  results: TestOutcome[];
}

export type RuntimeQuestion = Pick<
  Question,
  | "id"
  | "kind"
  | "tests"
  | "mcq_options"
  | "mcq_answer"
  | "setup_sql"
  | "starter_code"
  | "language"
> & {
  /** Reference query for grading SQL (practice only — never sent during exams). */
  reference_sql?: string | null;
};

export interface RuntimeProps {
  question: RuntimeQuestion;
  mode: RuntimeMode;
  /** Bubble the current answer up (code / selected key) for exam submission. */
  onAnswerChange?: (answer: string) => void;
  /** Practice mode: fired after the learner checks/runs tests. */
  onGraded?: (result: GradeResult) => void;
  /** Restore a prior answer (exam resume). */
  initialAnswer?: string;
  /** Controlled custom stdin (host supplies its own input UI, e.g. the IDE). */
  stdin?: string;
  onStdinChange?: (value: string) => void;
  /** IDE layout: full-height editor + Run/Submit fixed at the bottom-right. */
  ide?: boolean;
  /** Bubble Run/Submit results up for display in the host's Test Cases panel. */
  onOutcomes?: (summary: RunSummary | null) => void;
  /** Bubble the raw "Run code" (custom input) output up to the host. */
  onRunOutput?: (out: RunOutput | null) => void;
  /** Exam variant of the IDE editor: "Test Run" (checks all) + "Submit". */
  exam?: boolean;
  /** Fired on exam Submit with the full checked results (the final answer). */
  onSubmit?: (summary: RunSummary) => void;
  /** SQL: bubble the query result / grading up to the host's Test Cases panel. */
  onSqlOutcome?: (outcome: SqlOutcome | null) => void;
}

/** Raw output of a custom-input run. */
export interface RunOutput {
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

/** A SQL query result (or error). */
export interface SqlResultData {
  columns: string[];
  rows: unknown[][];
  error?: string;
  affected?: number;
}

/** Result of a SQL Run/Submit, shown in the host's Test Cases panel. */
export interface SqlOutcome {
  mode: "run" | "submit";
  result: SqlResultData;
  expected?: SqlResultData;
  passed?: boolean;
}
