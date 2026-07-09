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
    .select("id, subject_id, topic_id, difficulty");
  return (data as QuestionMinimal[]) ?? [];
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
