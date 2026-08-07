"use client";

/**
 * One-time browser state for returning from the question workspace to the
 * subject question list exactly where the learner left it.
 *
 * sessionStorage keeps this scoped to the current tab: opening the same subject
 * in another tab should not unexpectedly jump that tab or inherit its filters.
 */
export interface QuestionListFilters {
  query: string;
  status: string;
  topic: string;
  exam: string;
  branch: string;
  level: string;
  difficulty: string;
}

export interface QuestionListReturn {
  href: string;
  scrollY: number;
  /** Number of lazy rows present when the learner opened the question. */
  loadedCount?: number;
  filters: QuestionListFilters;
  savedAt: number;
}

const PREFIX = "oppe:question-list-return:";
const MAX_AGE_MS = 60 * 60 * 1000;

function key(slug: string): string {
  return `${PREFIX}${slug}`;
}

function valid(value: unknown): value is QuestionListReturn {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<QuestionListReturn>;
  return (
    typeof state.href === "string" &&
    state.href.startsWith("/app/subjects/") &&
    typeof state.scrollY === "number" &&
    (state.loadedCount === undefined || typeof state.loadedCount === "number") &&
    typeof state.savedAt === "number" &&
    Date.now() - state.savedAt <= MAX_AGE_MS &&
    !!state.filters
  );
}

export function saveQuestionListReturn(
  slug: string,
  input: Omit<QuestionListReturn, "savedAt">,
): void {
  try {
    window.sessionStorage.setItem(
      key(slug),
      JSON.stringify({ ...input, savedAt: Date.now() }),
    );
  } catch {
    /* Scroll restoration is a convenience; private mode may disable storage. */
  }
}

/** Read without removing, so the question workspace can choose its back URL. */
export function peekQuestionListReturn(
  slug: string,
): QuestionListReturn | null {
  try {
    const raw = window.sessionStorage.getItem(key(slug));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (valid(parsed)) return parsed;
    window.sessionStorage.removeItem(key(slug));
  } catch {
    /* Ignore unavailable or corrupt browser storage. */
  }
  return null;
}

/** Consume on the subject page so a later, unrelated visit does not jump. */
export function consumeQuestionListReturn(
  slug: string,
): QuestionListReturn | null {
  const state = peekQuestionListReturn(slug);
  if (!state) return null;
  try {
    window.sessionStorage.removeItem(key(slug));
  } catch {
    /* The valid state can still be restored for this navigation. */
  }
  return state;
}
