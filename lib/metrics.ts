import type { Attempt, Question } from "@/lib/types";
import { dayKey } from "@/lib/utils";
import type { QuestionStatus } from "@/components/ui/status";

/** Best (minimum) solved time per question, in seconds. */
export function bestTimeByQuestion(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    if (a.status !== "solved") continue;
    const cur = m.get(a.question_id);
    if (cur === undefined || a.time_spent_seconds < cur) {
      m.set(a.question_id, a.time_spent_seconds);
    }
  }
  return m;
}

/** Highest reached status per question (solved beats attempted). */
export function statusByQuestion(
  attempts: Attempt[],
): Map<string, QuestionStatus> {
  const m = new Map<string, QuestionStatus>();
  for (const a of attempts) {
    if (a.status === "solved") {
      m.set(a.question_id, "solved");
    } else if (m.get(a.question_id) !== "solved") {
      m.set(a.question_id, "attempted");
    }
  }
  return m;
}

function addDayKey(key: string, deltaDays: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return dayKey(d);
}

export interface Streaks {
  current: number;
  longest: number;
  activeDays: Set<string>;
}

/** Consecutive-day activity streaks computed from attempt timestamps. */
export function computeStreaks(attempts: Attempt[], today = new Date()): Streaks {
  const activeDays = new Set(
    attempts.map((a) => dayKey(new Date(a.created_at))),
  );
  const sorted = [...activeDays].sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    run = prev && addDayKey(prev, 1) === key ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = key;
  }

  let current = 0;
  let cursor = dayKey(today);
  if (!activeDays.has(cursor)) cursor = addDayKey(cursor, -1);
  while (activeDays.has(cursor)) {
    current += 1;
    cursor = addDayKey(cursor, -1);
  }

  return { current, longest, activeDays };
}

export interface ProgressSummary {
  totalQuestions: number;
  solvedCount: number;
  attemptedCount: number;
  accuracyPct: number | null;
  totalTimeSeconds: number;
  avgSolveSeconds: number | null;
  streaks: Streaks;
  solvedPerDay: { key: string; label: string; count: number }[];
  solveTimeSeries: { at: string; seconds: number }[];
}

/**
 * Everything the Dashboard and Progress screens need, computed on read from
 * the raw attempt log + the question set. No colour, just numbers.
 */
export function computeProgress(
  attempts: Attempt[],
  totalQuestions: number,
  today = new Date(),
): ProgressSummary {
  const status = statusByQuestion(attempts);
  let solvedCount = 0;
  let attemptedCount = 0;
  for (const s of status.values()) {
    attemptedCount += 1;
    if (s === "solved") solvedCount += 1;
  }

  const accuracyPct =
    attemptedCount > 0 ? Math.round((solvedCount / attemptedCount) * 100) : null;

  const totalTimeSeconds = attempts.reduce(
    (sum, a) => sum + a.time_spent_seconds,
    0,
  );

  const bestTimes = bestTimeByQuestion(attempts);
  const solveTimes = [...bestTimes.values()];
  const avgSolveSeconds =
    solveTimes.length > 0
      ? Math.round(solveTimes.reduce((s, t) => s + t, 0) / solveTimes.length)
      : null;

  const streaks = computeStreaks(attempts, today);

  // Solved-per-day across the last 14 days (distinct question solves per day).
  const solvedDaySets = new Map<string, Set<string>>();
  for (const a of attempts) {
    if (a.status !== "solved") continue;
    const key = dayKey(new Date(a.created_at));
    if (!solvedDaySets.has(key)) solvedDaySets.set(key, new Set());
    solvedDaySets.get(key)!.add(a.question_id);
  }
  const solvedPerDay: ProgressSummary["solvedPerDay"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    solvedPerDay.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: solvedDaySets.get(key)?.size ?? 0,
    });
  }

  // Time-per-solve trend, oldest first: the best (fastest) time per question,
  // ordered by when the question was first solved. Uses the same best-time
  // numbers as avgSolveSeconds so the sparkline, Fastest, and Average agree.
  const firstSolveOrder = [...attempts]
    .filter((a) => a.status === "solved")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  const seen = new Set<string>();
  const solveTimeSeries: ProgressSummary["solveTimeSeries"] = [];
  for (const a of firstSolveOrder) {
    if (seen.has(a.question_id)) continue;
    seen.add(a.question_id);
    solveTimeSeries.push({
      at: a.created_at,
      seconds: bestTimes.get(a.question_id) ?? a.time_spent_seconds,
    });
  }

  return {
    totalQuestions,
    solvedCount,
    attemptedCount,
    accuracyPct,
    totalTimeSeconds,
    avgSolveSeconds,
    streaks,
    solvedPerDay,
    solveTimeSeries,
  };
}

/** Accuracy (solved / attempted) grouped by topic, for the Progress view. */
export function accuracyByTopic(
  attempts: Attempt[],
  questions: Pick<Question, "id" | "topic_id">[],
  topics: { id: string; name: string }[],
): { topic: string; solved: number; attempted: number; pct: number }[] {
  const topicOfQuestion = new Map(questions.map((q) => [q.id, q.topic_id]));
  const status = statusByQuestion(attempts);

  const byTopic = new Map<string, { solved: number; attempted: number }>();
  for (const [questionId, s] of status) {
    const topicId = topicOfQuestion.get(questionId);
    if (!topicId) continue;
    const entry = byTopic.get(topicId) ?? { solved: 0, attempted: 0 };
    entry.attempted += 1;
    if (s === "solved") entry.solved += 1;
    byTopic.set(topicId, entry);
  }

  return topics
    .map((t) => {
      const e = byTopic.get(t.id) ?? { solved: 0, attempted: 0 };
      return {
        topic: t.name,
        solved: e.solved,
        attempted: e.attempted,
        pct: e.attempted > 0 ? Math.round((e.solved / e.attempted) * 100) : 0,
      };
    })
    .filter((r) => r.attempted > 0);
}
