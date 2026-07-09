import type { Question } from "@/lib/types";

export type RuntimeMode = "practice" | "exam";

export interface GradeResult {
  correct: boolean;
  passed: number;
  total: number;
}

export type RuntimeQuestion = Pick<
  Question,
  "id" | "kind" | "tests" | "mcq_options" | "mcq_answer" | "setup_sql"
>;

export interface RuntimeProps {
  question: RuntimeQuestion;
  mode: RuntimeMode;
  /** Bubble the current answer up (code / selected key) for exam submission. */
  onAnswerChange?: (answer: string) => void;
  /** Practice mode: fired after the learner checks/runs tests. */
  onGraded?: (result: GradeResult) => void;
  /** Restore a prior answer (exam resume). */
  initialAnswer?: string;
}
