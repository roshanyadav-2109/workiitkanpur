import type { QuestionStatus } from "@/components/ui/status";
import type { QuestionListItem } from "@/lib/queries";
import type { Attempt, Difficulty, QuestionKind } from "@/lib/types";

/** Small enough for a quick first paint, large enough to avoid chatty paging. */
export const QUESTION_BATCH_SIZE = 30;

export interface QuestionRow {
  id: string;
  title: string;
  topicId: string | null;
  topicName: string | null;
  week: number | null;
  kind: QuestionKind;
  exam: string | null;
  difficulty: Difficulty;
  branch?: string | null;
  level?: string | null;
  tags: string[];
  status: QuestionStatus;
  bestTimeSeconds: number | null;
}

export interface QuestionProgressItem {
  status: QuestionStatus;
  bestTimeSeconds: number | null;
}

export type QuestionProgress = Record<string, QuestionProgressItem>;

export interface QuestionBatchResponse {
  rows: QuestionRow[];
  hasMore: boolean;
  nextOffset: number;
}

type AttemptMetric = Pick<
  Attempt,
  "question_id" | "status" | "time_spent_seconds"
>;

/** Compact, serializable progress map shared by the initial and lazy rows. */
export function questionProgress(
  attempts: readonly AttemptMetric[],
): QuestionProgress {
  const progress: QuestionProgress = {};

  for (const attempt of attempts) {
    const current = progress[attempt.question_id];
    const solved = attempt.status === "solved";
    progress[attempt.question_id] = {
      status: solved ? "solved" : current?.status ?? "attempted",
      bestTimeSeconds: solved
        ? current?.bestTimeSeconds == null
          ? attempt.time_spent_seconds
          : Math.min(current.bestTimeSeconds, attempt.time_spent_seconds)
        : current?.bestTimeSeconds ?? null,
    };
  }

  return progress;
}

/** Turn cached public records into the exact lightweight shape the UI needs. */
export function questionRows(
  questions: readonly QuestionListItem[],
  progress: QuestionProgress = {},
): QuestionRow[] {
  return questions.map((question) => ({
    id: question.id,
    title: question.title,
    topicId: question.topic?.id ?? question.topic_id,
    topicName: question.topic?.name ?? null,
    week: question.topic?.week ?? null,
    kind: question.kind,
    exam: question.exam,
    difficulty: question.difficulty,
    tags: question.tags ?? [],
    status: progress[question.id]?.status ?? "unsolved",
    bestTimeSeconds: progress[question.id]?.bestTimeSeconds ?? null,
  }));
}
