import "server-only";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createContentClient } from "@/lib/supabase/content";
import { watermarkMarkdown } from "@/lib/watermark";
import type { Question } from "@/lib/types";

/**
 * Who may see what of a question, and how that is kept honest.
 *
 *   - Anyone: the question and its visible tests, as search engines index it.
 *     The hidden tests' inputs and outputs and the MCQ answer key are not sent
 *     (forAnonymous).
 *   - A signed-in student: all of it — each question or paper opened is
 *     recorded, and an account that opens them far faster than anyone studies
 *     is refused for a while (open_question / open_test_set, 0025).
 *   - Every question a signed-in student is shown carries an invisible mark of
 *     their account in its text (lib/watermark.ts), so a copy found elsewhere
 *     says which account it came from.
 */

export interface OpenResult {
  allowed: boolean;
  openedLastHour: number;
  openedToday: number;
}

async function open(fn: "open_question" | "open_test_set", arg: string, id: string): Promise<OpenResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, { [arg]: id });
  if (error) {
    // The limit is a guard, not the gate: a failure to record must not lock a student out.
    console.error(`${fn} failed — ${error.message}`);
    return { allowed: true, openedLastHour: 0, openedToday: 0 };
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed: boolean; opened_last_hour: number; opened_today: number }
    | null;
  return {
    allowed: row?.allowed ?? true,
    openedLastHour: row?.opened_last_hour ?? 0,
    openedToday: row?.opened_today ?? 0,
  };
}

/** Record that the signed-in student opened a practice question; false when over the limit. */
export function openQuestion(questionId: string) {
  return open("open_question", "p_question", questionId);
}

/** Record that the signed-in student opened a test paper; false when over the limit. */
export function openTestSet(setId: string) {
  return open("open_test_set", "p_set", setId);
}

/** Note something that looks like copying, for staff to review. Never throws. */
export async function recordSignal(signal: {
  kind: "limit" | "trap";
  userId?: string | null;
  questionId?: string | null;
  setId?: string | null;
  path?: string;
}) {
  try {
    const request = await headers();
    await createContentClient()
      .from("scrape_signals")
      .insert({
        kind: signal.kind,
        user_id: signal.userId ?? null,
        question_id: signal.questionId ?? null,
        set_id: signal.setId ?? null,
        path: signal.path?.slice(0, 300) ?? null,
        ip: request.get("x-real-ip") ?? request.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: request.get("user-agent")?.slice(0, 300) ?? null,
      });
  } catch (error) {
    console.error(`scrape signal not recorded — ${error instanceof Error ? error.message : error}`);
  }
}

/** A question as shown before sign-in: nothing that gives the hidden tests or the answer away. */
export function forAnonymous<T extends Pick<Question, "tests" | "mcq_answer">>(question: T): T {
  return {
    ...question,
    mcq_answer: null,
    tests: (question.tests ?? []).map((test) =>
      test.hidden ? { stdin: "", expected: "", hidden: true } : test,
    ),
  };
}

/** A question with the signed-in student's mark in its text. */
export function marked<T extends { body_md: string }>(question: T, userId: string): T {
  return { ...question, body_md: watermarkMarkdown(question.body_md, userId) };
}
