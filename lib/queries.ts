import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getVerifiedUser } from "@/lib/supabase/auth";
import { displayName } from "@/lib/utils";

/**
 * Shared cache settings for public, cross-user content. These queries carry no
 * per-user data, so their results are cached in Next's Data Cache and reused
 * for every visitor — Supabase is hit at most once per revalidate window
 * instead of once per request. Tags allow on-demand invalidation.
 */
// Public course content changes through the admin/database workflow, whose
// revalidation endpoint expires this tag explicitly. Keep it shared until then
// so a cold Supabase read is paid once rather than once per visitor or per hour.
const CONTENT = { revalidate: false, tags: ["content"] } as const;
// Bump only when content changed directly and the production revalidation hook
// was unavailable. This refreshes the restored DBMS topic labels once; every
// batch is then shared across visitors indefinitely again.
const QUESTION_CONTENT_REVISION = "2026-08-dbms-topics";
// Never allow pre-hardening leaderboard rows (auth UUID + profile-derived
// names) to survive a deployment through the persistent Data Cache.
const LEADERBOARD_SECURITY_REVISION = "2026-08-public-names-v2";
const TEST_SET_CONTENT_REVISION = "2026-08-dbms-oppe-label";
const BOARD = { revalidate: 120, tags: ["leaderboard"] } as const; // leaderboards — 2m

/** unstable_cache wrapper that preserves the wrapped function's exact type
 *  (its own single-type-param signature otherwise widens results to `any`). */
function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  opts: { revalidate: number | false; tags: readonly string[] },
): (...args: A) => Promise<R> {
  return unstable_cache(fn, keyParts, {
    revalidate: opts.revalidate,
    tags: [...opts.tags],
  }) as (...args: A) => Promise<R>;
}
import type {
  Attempt,
  Difficulty,
  Note,
  Question,
  QuestionWithTopic,
  Subject,
  Topic,
} from "@/lib/types";
import type { Curriculum } from "@/lib/curriculum";
import type { TestSection, TestSet } from "@/lib/test-series";

/**
 * The signed-in user, or null.
 *
 * The ES256 access token is verified locally with Supabase's cached public key,
 * rather than downloading the Auth user record on every request. React
 * `cache()` also collapses layout/page callers into one verification.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();
  return getVerifiedUser(supabase);
});

/** Whether the user has a phone on file — cached alongside the user lookup. */
export const getProfilePhone = cache(async function getProfilePhone(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();
  return data?.phone ?? null;
});

/** Stable public identifier for recognising the signed-in learner's own
 * aggregate row without exposing their authentication UUID. */
export const getProfilePublicId = cache(async function getProfilePublicId(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("public_id")
    .eq("id", userId)
    .maybeSingle();
  return (data?.public_id as string | null | undefined) ?? null;
});

export const getSubjects = cached(
  async function getSubjects(): Promise<Subject[]> {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    return data ?? [];
  },
  ["subjects"],
  CONTENT,
);

/**
 * The degree / level / subject map. Small reference data, read once per page
 * and then passed down — client components never query it themselves.
 */
export const getCurriculum = cached(async function getCurriculum(): Promise<Curriculum> {
  const supabase = createPublicClient();
  const [{ data: degrees }, { data: offerings }] = await Promise.all([
    supabase
      .from("degrees")
      .select("slug, name, short_name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("subject_offerings")
      .select("level, sort_order, subject:subjects(slug), degree:degrees(slug)")
      .order("sort_order", { ascending: true }),
  ]);

  type OfferingRow = {
    level: string;
    subject: { slug: string } | null;
    degree: { slug: string } | null;
  };

  return {
    degrees: (degrees ?? []).map(
      (d: { slug: string; name: string; short_name: string }) => ({
        id: d.slug,
        name: d.name,
        shortName: d.short_name,
      }),
    ),
    offerings: ((offerings ?? []) as unknown as OfferingRow[])
      .filter((o) => o.subject?.slug && o.degree?.slug)
      .map((o) => ({
        subject: o.subject!.slug,
        degree: o.degree!.slug,
        level: o.level,
      })),
  };
}, ["curriculum"], CONTENT);

/**
 * The Test Series papers for a subject, newest first, each with its problems
 * grouped into the sections the original exam used.
 */
const TEST_SET_COLUMNS =
  "slug, title, exam, category, duration_seconds, is_available, sort_order, " +
  "questions:test_set_questions(question_id, section, marks, sort_order)";
const TEST_SET_RULES = ", rules:test_set_sections(name, best_of, note, sort_order)";

export const getTestSets = cached(async function getTestSets(
  subjectId: string,
  category?: TestSet["category"],
): Promise<TestSet[]> {
  const supabase = createPublicClient();
  const read = (columns: string) => {
    const query = supabase
      .from("test_sets")
      .select(columns)
      .eq("subject_id", subjectId)
      .order("sort_order", { ascending: true });
    return category ? query.eq("category", category) : query;
  };

  // Per-section rules live in their own table, which a deployment can reach
  // before its migration has run. A paper without that table still has its
  // sections and its questions, so read it again without the rules rather than
  // failing — otherwise a missing table would take down every paper, not just
  // the one relying on a rule.
  const withRules = await read(TEST_SET_COLUMNS + TEST_SET_RULES);
  let sets = withRules.data;
  if (withRules.error) ({ data: sets } = await read(TEST_SET_COLUMNS));

  type Row = {
    slug: string;
    title: string;
    exam: string | null;
    category: "pyq" | "mock";
    duration_seconds: number;
    is_available: boolean;
    questions: {
      question_id: string;
      section: string | null;
      marks: number | null;
      sort_order: number;
    }[] | null;
    /** Absent when the section-rules table isn't there yet. */
    rules?: {
      name: string;
      best_of: number | null;
      note: string | null;
      sort_order: number;
    }[] | null;
  };

  return ((sets ?? []) as unknown as Row[]).map((s) => {
    const items = [...(s.questions ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const ruleOf = new Map((s.rules ?? []).map((r) => [r.name, r]));
    // Preserve the paper's own section order rather than sorting by name.
    const sections: TestSection[] = [];
    for (const item of items) {
      const name = item.section ?? "Questions";
      let section = sections.find((x) => x.name === name);
      if (!section) {
        const rule = ruleOf.get(name);
        section = {
          name,
          week: null,
          questionIds: [],
          marks: {},
          bestOf: rule?.best_of ?? null,
          note: rule?.note ?? null,
        };
        sections.push(section);
      }
      section.questionIds.push(item.question_id);
      // A question with no explicit marks is worth 1.
      section.marks![item.question_id] = item.marks ?? 1;
    }
    return {
      id: s.slug,
      name: s.title,
      exam: s.exam ?? null,
      category: s.category ?? "mock",
      durationSeconds: s.duration_seconds,
      available: s.is_available && items.length > 0,
      sections,
    };
  });
}, ["test-sets", TEST_SET_CONTENT_REVISION], CONTENT);

export const getSubjectBySlug = cached(async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}, ["subject-by-slug"], CONTENT);

export const getTopicsForSubject = cached(async function getTopicsForSubject(subjectId: string): Promise<Topic[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subjectId)
    .order("sort_order", { ascending: true })
    .order("week", { ascending: true });
  return data ?? [];
}, ["topics", QUESTION_CONTENT_REVISION], CONTENT);

/** One row of the practice list / IDE side-nav. List columns only. */
export interface QuestionListItem {
  id: string;
  title: string;
  topic_id: string | null;
  kind: Question["kind"];
  exam: string | null;
  difficulty: Difficulty;
  tags: string[] | null;
  practice_only: boolean;
  topic: { id: string; name: string; week: number | null } | null;
}

/**
 * The practice bank for a subject, list columns only.
 *
 * Deliberately narrow: `select("*")` here dragged body_md, solution_md, tests,
 * harness and starter_code for every question in the subject (~1.1 MB) across
 * the wire twice — once from Postgres, then again in the RSC payload — to
 * render rows that use nine short fields (~27 kB). Test Series questions are
 * filtered out in SQL rather than in JS for the same reason.
 */
export const getSubjectQuestionList = cached(async function getSubjectQuestionList(
  subjectId: string,
): Promise<QuestionListItem[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "id, title, topic_id, kind, exam, difficulty, tags, practice_only, topic:topics(id, name, week)",
    )
    .eq("subject_id", subjectId)
    .eq("practice_only", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  return (data as unknown as QuestionListItem[]) ?? [];
}, ["subject-question-list", QUESTION_CONTENT_REVISION], CONTENT);

export interface SubjectQuestionPage {
  questions: QuestionListItem[];
  hasMore: boolean;
}

/**
 * One shared page of practice rows. `range` is inclusive, so one extra record
 * is requested only to determine whether another page exists. Function
 * arguments form part of the Data Cache key, making every batch reusable
 * across visitors.
 */
export const getSubjectQuestionPage = cached(async function getSubjectQuestionPage(
  subjectId: string,
  offset: number,
  limit: number,
): Promise<SubjectQuestionPage> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "id, title, topic_id, kind, exam, difficulty, tags, practice_only, topic:topics(id, name, week)",
    )
    .eq("subject_id", subjectId)
    .eq("practice_only", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(safeOffset, safeOffset + safeLimit);

  const questions = (data as unknown as QuestionListItem[]) ?? [];
  return {
    questions: questions.slice(0, safeLimit),
    hasMore: questions.length > safeLimit,
  };
}, ["subject-question-page", QUESTION_CONTENT_REVISION], CONTENT);

/**
 * Full question payloads for the handful of questions in one paper.
 *
 * The exam runner used to load every question in the subject and keep the
 * eight it needed; this fetches only those eight.
 */
const getQuestionsForRunContent = cached(async function getQuestionsForRunContent(
  ids: string[],
): Promise<Omit<QuestionWithTopic, "solution_md" | "topic">[]> {
  if (ids.length === 0) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "id, subject_id, topic_id, title, body_md, difficulty, kind, tags, sort_order, created_at, tests, mcq_options, mcq_answer, setup_sql, starter_code, language, harness, input_labels, exam, practice_only",
    )
    .in("id", ids);
  return (
    (data as unknown as Omit<QuestionWithTopic, "solution_md" | "topic">[]) ??
    []
  );
}, ["questions-for-run", QUESTION_CONTENT_REVISION], CONTENT);

export async function getQuestionsForRun(
  ids: string[],
): Promise<QuestionWithTopic[]> {
  if (ids.length === 0) return [];
  const [questions, solutions] = await Promise.all([
    getQuestionsForRunContent(ids),
    getQuestionSolutions(ids),
  ]);
  return questions.map((question) => ({
    ...question,
    solution_md: solutions.get(question.id) ?? null,
    topic: null,
  }));
}

export interface QuestionContext {
  question: Question;
  subject: Pick<Subject, "id" | "slug" | "name" | "short_code" | "is_active">;
  topic: Pick<Topic, "id" | "name" | "week"> | null;
}

/**
 * A question with the subject and topic it belongs to.
 *
 * Closing a subject has to close its questions too. They are reachable by
 * direct link from the practice list, a bookmark, and the PDF export, so the
 * check belongs here rather than on each page — a closed subject's question
 * simply doesn't exist, and every caller gets that for free.
 */
export const getQuestionById = cached(async function getQuestionById(
  id: string,
): Promise<QuestionContext | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "id, subject_id, topic_id, title, body_md, difficulty, kind, tags, sort_order, created_at, tests, mcq_options, mcq_answer, setup_sql, input_labels, exam, starter_code, language, harness, practice_only, subject:subjects(id, slug, name, short_code, is_active), topic:topics(id, name, week)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const { subject, topic, ...question } = data as unknown as Question & {
    subject: QuestionContext["subject"];
    topic: QuestionContext["topic"];
  };
  if (!subject?.is_active) return null;
  return {
    question: { ...question, solution_md: null },
    subject,
    topic,
  };
}, ["question-by-id", QUESTION_CONTENT_REVISION], CONTENT);

export type AttemptSummary = Pick<
  Attempt,
  "id" | "question_id" | "status" | "time_spent_seconds" | "created_at"
>;

/** Only the attempt fields used by progress metrics, newest first. */
export async function getUserAttempts(userId: string): Promise<AttemptSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select("id, question_id, status, time_spent_seconds, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as AttemptSummary[]) ?? [];
}

export interface MyQuestionProgress {
  question_id: string;
  subject_id: string;
  topic_id: string | null;
  status: Attempt["status"];
  time_spent_seconds: number;
}

type QuestionProgressSource = Pick<
  Attempt,
  "question_id" | "status" | "time_spent_seconds"
> & {
  question: { subject_id: string; topic_id: string | null } | null;
};

function aggregateQuestionProgress(
  rows: readonly QuestionProgressSource[],
): MyQuestionProgress[] {
  const grouped = new Map<string, MyQuestionProgress>();
  for (const row of rows) {
    if (!row.question) continue;
    const current = grouped.get(row.question_id);
    const solved = row.status === "solved";
    grouped.set(row.question_id, {
      question_id: row.question_id,
      subject_id: row.question.subject_id,
      topic_id: row.question.topic_id,
      status: solved ? "solved" : (current?.status ?? "attempted"),
      time_spent_seconds: solved
        ? current?.status === "solved"
          ? Math.min(current.time_spent_seconds, row.time_spent_seconds)
          : row.time_spent_seconds
        : (current?.time_spent_seconds ?? 0),
    });
  }
  return [...grouped.values()];
}

/** One aggregate row per attempted question for the current JWT identity. */
export async function getMyQuestionProgress(
  subjectId: string | null = null,
): Promise<MyQuestionProgress[]> {
  const supabase = await createClient();
  let query = supabase
    .from("attempts")
    .select(
      "question_id, status, time_spent_seconds, question:questions!inner(subject_id, topic_id)",
    );
  if (subjectId) query = query.eq("question.subject_id", subjectId);

  const { data } = await query;
  return aggregateQuestionProgress(
    (data as unknown as QuestionProgressSource[]) ?? [],
  );
}

/** Dashboard attempt history and question/topic progress from one PostgREST
 * response, avoiding two overlapping downloads of the same attempt rows. */
export async function getUserProgressData(userId: string): Promise<{
  attempts: AttemptSummary[];
  progress: MyQuestionProgress[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select(
      "id, question_id, status, time_spent_seconds, created_at, question:questions!inner(subject_id, topic_id)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows =
    (data as unknown as (AttemptSummary & QuestionProgressSource)[]) ?? [];
  return {
    attempts: rows.map((row) => ({
      id: row.id,
      question_id: row.question_id,
      status: row.status,
      time_spent_seconds: row.time_spent_seconds,
      created_at: row.created_at,
    })),
    progress: aggregateQuestionProgress(rows),
  };
}

export interface AttemptWithQuestion extends AttemptSummary {
  question: Pick<Question, "id" | "title" | "difficulty"> | null;
}

/** Recent activity: attempts joined with their question titles. */
export async function getRecentActivity(
  userId: string,
  limit = 8,
): Promise<AttemptWithQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select(
      "id, question_id, status, time_spent_seconds, created_at, question:questions(id, title, difficulty)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as AttemptWithQuestion[]) ?? [];
}

export async function getAttemptsForQuestion(
  userId: string,
  questionId: string,
): Promise<Attempt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getNote(
  userId: string,
  questionId: string,
): Promise<Note | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();
  return data ?? null;
}

/** Total question count (across all subjects). */
export const getQuestionCount = cached(async function getQuestionCount(): Promise<number> {
  const supabase = createPublicClient();
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}, ["question-count"], CONTENT);

export interface SubjectQuestionStats {
  subject_id: string;
  total: number;
  exams: string[];
}

/** Compact, accurate catalogue counts. The narrow source rows are paged past
 * PostgREST's 1,000-row response cap, aggregated once, then shared from Next's
 * Data Cache instead of downloading the global question index per visitor. */
export const getSubjectQuestionStats = cached(async function getSubjectQuestionStats(): Promise<SubjectQuestionStats[]> {
  const supabase = createPublicClient();
  const rows: { subject_id: string; exam: string | null }[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("questions")
      .select("subject_id, exam")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error || !data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  const grouped = new Map<string, { total: number; exams: Set<string> }>();
  for (const row of rows) {
    const current = grouped.get(row.subject_id) ?? {
      total: 0,
      exams: new Set<string>(),
    };
    current.total += 1;
    if (row.exam) current.exams.add(row.exam);
    grouped.set(row.subject_id, current);
  }
  return [...grouped].map(([subject_id, value]) => ({
    subject_id,
    total: value.total,
    exams: [...value.exams].sort(),
  }));
}, ["subject-question-stats", QUESTION_CONTENT_REVISION], CONTENT);

export interface LeaderboardRow {
  public_id: string;
  name: string;
  solved: number;
  total_seconds: number;
}

/** Cross-user leaderboard (reads the aggregated, RLS-bypassing view). */
export const getLeaderboard = cached(async function getLeaderboard(limit: number = 50): Promise<LeaderboardRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("leaderboard_overall")
    .select("public_id, name, solved, total_seconds")
    .order("solved", { ascending: false })
    .order("total_seconds", { ascending: true })
    .limit(limit);
  return ((data as LeaderboardRow[]) ?? []).map((r) => ({
    ...r,
    name: displayName(r.name),
  }));
}, ["leaderboard-overall", LEADERBOARD_SECURITY_REVISION], BOARD);

export interface MockRow {
  set_id: string;
  set_name: string;
  public_id: string;
  name: string;
  score: number;
  total: number;
  time_seconds: number;
  submitted_at: string;
}

/** All mock/exam best-attempts across users (RLS-bypassing view), per set. */
export const getMockBoard = cached(async function getMockBoard(): Promise<MockRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("mock_leaderboard")
    .select("set_id, set_name, public_id, name, score, total, time_seconds, submitted_at")
    .order("set_id", { ascending: true })
    .order("score", { ascending: false })
    .order("time_seconds", { ascending: true });
  return ((data as MockRow[]) ?? []).map((r) => ({
    ...r,
    name: displayName(r.name),
  }));
}, ["mock-board", LEADERBOARD_SECURITY_REVISION], BOARD);

export interface TestAttemptRow {
  id: string;
  set_id: string;
  set_name: string;
  environment: "learning" | "exam";
  status: string;
  score: number | null;
  total: number | null;
  time_seconds: number | null;
  leave_count: number;
  started_at: string;
  submitted_at: string | null;
}

/** A learner's own Test Series attempts for one subject, newest first. */
export async function getTestAttempts(
  userId: string,
  slug: string,
): Promise<TestAttemptRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_attempts")
    .select(
      "id, set_id, set_name, environment, status, score, total, time_seconds, leave_count, started_at, submitted_at",
    )
    .eq("user_id", userId)
    .eq("subject_slug", slug)
    .order("started_at", { ascending: false });
  return (data as TestAttemptRow[]) ?? [];
}

export interface QuestionLeaderRow {
  question_id: string;
  public_id: string;
  name: string;
  best_time: number;
}

/** Fastest solvers of a single question (across all users). */
export const getQuestionLeaderboard = cached(async function getQuestionLeaderboard(
  questionId: string,
  limit: number = 10,
): Promise<QuestionLeaderRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("question_leaderboard")
    .select("question_id, public_id, name, best_time")
    .eq("question_id", questionId)
    .order("best_time", { ascending: true })
    .limit(limit);
  return (data as QuestionLeaderRow[]) ?? [];
}, ["question-leaderboard", LEADERBOARD_SECURITY_REVISION], BOARD);

/** All of the current user's submissions (question_id → last code). */
export async function getUserSubmissions(
  userId: string,
  limit = 30,
): Promise<{ question_id: string; code: string | null }[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("question_id, code")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);
  return (data as { question_id: string; code: string | null }[]) ?? [];
}

export interface CompareQuestion {
  id: string;
  title: string;
  body_md: string;
  solution_md: string | null;
  section: string;
  week: number | null;
  samples: { stdin: string; expected: string }[];
}

/** Authenticated access path for model solutions. Raw SELECT on questions does
 * not grant this column, so anonymous API calls cannot dump it. */
export async function getQuestionSolutions(
  ids: string[],
): Promise<Map<string, string | null>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_question_solutions", {
    target_ids: ids.slice(0, 100),
  });
  if (error) return new Map();
  return new Map(
    ((data ?? []) as { question_id: string; solution_md: string | null }[]).map(
      (row) => [row.question_id, row.solution_md],
    ),
  );
}

/** Question body + model solution + section + sample tests, for a set of ids. */
export async function getQuestionsByIds(
  ids: string[],
): Promise<CompareQuestion[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("id, title, body_md, tests, topic:topics(name, week)")
    .in("id", ids);
  const solutions = await getQuestionSolutions(ids);
  return (
    (data as unknown as {
      id: string;
      title: string;
      body_md: string;
      tests: { stdin: string; expected: string; hidden?: boolean }[] | null;
      topic: { name: string; week: number | null } | null;
    }[]) ?? []
  ).map((q) => ({
    id: q.id,
    title: q.title,
    body_md: q.body_md,
    solution_md: solutions.get(q.id) ?? null,
    section: q.topic?.name ?? "Other",
    week: q.topic?.week ?? null,
    samples: (q.tests ?? [])
      .filter((t) => !t.hidden)
      .map((t) => ({ stdin: t.stdin, expected: t.expected })),
  }));
}

/** The current user's own last submitted code for a question (RLS: own row). */
export async function getMySubmission(
  userId: string,
  questionId: string,
): Promise<{ code: string; language: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("code, language")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();
  return (data as { code: string; language: string | null } | null) ?? null;
}

export interface Banner {
  id: string;
  image_url: string;
  href: string | null;
  alt: string | null;
}

/** Active image banners for the subject-page carousel, in display order.
 *  Rows without an actual image are skipped so nothing empty ever renders. */
export const getCarouselBanners = cached(async function getCarouselBanners(): Promise<Banner[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("carousel_banners")
    .select("id, image_url, href, alt")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return ((data as Banner[]) ?? []).filter(
    (b) => typeof b.image_url === "string" && b.image_url.trim() !== "",
  );
}, ["carousel-banners"], CONTENT);

/** All topics (for progress grouping). */
export const getAllTopics = cached(async function getAllTopics(): Promise<Topic[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}, ["all-topics"], CONTENT);
