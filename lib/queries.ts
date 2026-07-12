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
