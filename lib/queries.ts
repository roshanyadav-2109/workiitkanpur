import { createClient } from "@/lib/supabase/server";
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

export interface QuestionMinimal {
  id: string;
  subject_id: string;
  topic_id: string | null;
  difficulty: Difficulty;
  exam: string | null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

/**
 * The degree / level / subject map. Small reference data, read once per page
 * and then passed down — client components never query it themselves.
 */
export async function getCurriculum(): Promise<Curriculum> {
  const supabase = await createClient();
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
}

/**
 * The Test Series papers for a subject, newest first, each with its problems
 * grouped into the sections the original exam used.
 */
export async function getTestSets(subjectId: string): Promise<TestSet[]> {
  const supabase = await createClient();
  const { data: sets } = await supabase
    .from("test_sets")
    .select(
      "slug, title, duration_seconds, is_available, sort_order, " +
        "questions:test_set_questions(question_id, section, marks, sort_order)",
    )
    .eq("subject_id", subjectId)
    .order("sort_order", { ascending: true });

  type Row = {
    slug: string;
    title: string;
    duration_seconds: number;
    is_available: boolean;
    questions: {
      question_id: string;
      section: string | null;
      sort_order: number;
    }[] | null;
  };

  return ((sets ?? []) as unknown as Row[]).map((s) => {
    const items = [...(s.questions ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    // Preserve the paper's own section order rather than sorting by name.
    const sections: TestSection[] = [];
    for (const item of items) {
      const name = item.section ?? "Questions";
      let section = sections.find((x) => x.name === name);
      if (!section) {
        section = { name, week: null, questionIds: [] };
        sections.push(section);
      }
      section.questionIds.push(item.question_id);
    }
    return {
      id: s.slug,
      name: s.title,
      durationSeconds: s.duration_seconds,
      available: s.is_available && items.length > 0,
      sections,
    };
  });
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function getTopicsForSubject(subjectId: string): Promise<Topic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subjectId)
    .order("sort_order", { ascending: true })
    .order("week", { ascending: true });
  return data ?? [];
}

export async function getQuestionsForSubject(
  subjectId: string,
): Promise<QuestionWithTopic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("*, topic:topics(id, name, week)")
    .eq("subject_id", subjectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as unknown as QuestionWithTopic[]) ?? [];
}

export interface QuestionContext {
  question: Question;
  subject: Pick<Subject, "id" | "slug" | "name" | "short_code">;
  topic: Pick<Topic, "id" | "name" | "week"> | null;
}

export async function getQuestionById(
  id: string,
): Promise<QuestionContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "*, subject:subjects(id, slug, name, short_code), topic:topics(id, name, week)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const { subject, topic, ...question } = data as unknown as Question & {
    subject: QuestionContext["subject"];
    topic: QuestionContext["topic"];
  };
  return { question, subject, topic };
}

/** All of a user's attempts, newest first. */
export async function getUserAttempts(userId: string): Promise<Attempt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface AttemptWithQuestion extends Attempt {
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
    .select("*, question:questions(id, title, difficulty)")
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
export async function getQuestionCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Lightweight question rows for cross-subject aggregation. */
export async function getAllQuestionsMinimal(): Promise<QuestionMinimal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("id, subject_id, topic_id, difficulty, exam");
  return (data as QuestionMinimal[]) ?? [];
}

export interface LeaderboardRow {
  user_id: string;
  name: string;
  solved: number;
  total_seconds: number;
}

/** Cross-user leaderboard (reads the aggregated, RLS-bypassing view). */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard_overall")
    .select("user_id, name, solved, total_seconds")
    .order("solved", { ascending: false })
    .order("total_seconds", { ascending: true })
    .limit(limit);
  return (data as LeaderboardRow[]) ?? [];
}

export interface MockRow {
  set_id: string;
  set_name: string;
  user_id: string;
  name: string;
  score: number;
  total: number;
  time_seconds: number;
  submitted_at: string;
}

/** All mock/exam best-attempts across users (RLS-bypassing view), per set. */
export async function getMockBoard(): Promise<MockRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_leaderboard")
    .select("set_id, set_name, user_id, name, score, total, time_seconds, submitted_at")
    .order("set_id", { ascending: true })
    .order("score", { ascending: false })
    .order("time_seconds", { ascending: true });
  return (data as MockRow[]) ?? [];
}

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
  user_id: string;
  name: string;
  best_time: number;
}

/** Fastest solvers of a single question (across all users). */
export async function getQuestionLeaderboard(
  questionId: string,
  limit = 10,
): Promise<QuestionLeaderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_leaderboard")
    .select("question_id, user_id, name, best_time")
    .eq("question_id", questionId)
    .order("best_time", { ascending: true })
    .limit(limit);
  return (data as QuestionLeaderRow[]) ?? [];
}

export interface QuestionSolution {
  user_id: string;
  name: string;
  best_time: number;
  code: string | null;
  language: string | null;
  note: string | null;
}

/** Top solvers of a question with their last submitted code + note, fastest first. */
export async function getQuestionTopSolutions(
  questionId: string,
  limit = 10,
): Promise<QuestionSolution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_top_solutions")
    .select("user_id, name, best_time, code, language, note")
    .eq("question_id", questionId)
    .order("best_time", { ascending: true })
    .limit(limit);
  return (data as QuestionSolution[]) ?? [];
}

/** All of the current user's submissions (question_id → last code). */
export async function getUserSubmissions(
  userId: string,
): Promise<{ question_id: string; code: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("question_id, code")
    .eq("user_id", userId);
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

/** Question body + model solution + section + sample tests, for a set of ids. */
export async function getQuestionsByIds(
  ids: string[],
): Promise<CompareQuestion[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("id, title, body_md, solution_md, tests, topic:topics(name, week)")
    .in("id", ids);
  return (
    (data as unknown as {
      id: string;
      title: string;
      body_md: string;
      solution_md: string | null;
      tests: { stdin: string; expected: string; hidden?: boolean }[] | null;
      topic: { name: string; week: number | null } | null;
    }[]) ?? []
  ).map((q) => ({
    id: q.id,
    title: q.title,
    body_md: q.body_md,
    solution_md: q.solution_md,
    section: q.topic?.name ?? "Other",
    week: q.topic?.week ?? null,
    samples: (q.tests ?? [])
      .filter((t) => !t.hidden)
      .map((t) => ({ stdin: t.stdin, expected: t.expected })),
  }));
}

/** Up to the top 3 fastest solvers (name + code) per question. */
export async function getTopSolutionsMap(
  ids: string[],
): Promise<Record<string, { name: string; code: string | null }[]>> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_top_solutions")
    .select("question_id, name, code, best_time")
    .in("question_id", ids)
    .order("best_time", { ascending: true });
  const map: Record<string, { name: string; code: string | null }[]> = {};
  for (const r of (data ?? []) as {
    question_id: string;
    name: string;
    code: string | null;
  }[]) {
    const arr = map[r.question_id] ?? (map[r.question_id] = []);
    if (arr.length < 3) arr.push({ name: r.name, code: r.code });
  }
  return map;
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
export async function getCarouselBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("carousel_banners")
    .select("id, image_url, href, alt")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return ((data as Banner[]) ?? []).filter(
    (b) => typeof b.image_url === "string" && b.image_url.trim() !== "",
  );
}

/** All topics (for progress grouping). */
export async function getAllTopics(): Promise<Topic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
