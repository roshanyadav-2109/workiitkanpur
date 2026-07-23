/**
 * Database types for the OPPE Practice Platform.
 * Hand-authored to match supabase/migrations/0001_init.sql.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionKind = "mcq" | "coding" | "sql" | "shell";
export type AttemptStatus = "attempted" | "solved";

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  short_code: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  week: number | null;
  sort_order: number;
}

export interface TestCase {
  stdin: string;
  expected: string;
  hidden?: boolean;
  /**
   * Files placed in the program's working directory before it runs, as
   * { "number.txt": "3" }. Questions that read input from a file rather than
   * stdin use this; the runtime writes them into the sandbox filesystem.
   */
  files?: Record<string, string>;
  /**
   * Arguments after the program name, so `sys.argv[1]` is `argv[0]` here.
   * A question whose program takes the database name on the command line
   * supplies it per test case, which is also how the grading dataset gets
   * varied between the public and private runs.
   */
  argv?: string[];
  /**
   * The database this case runs against, as SQL. A SQL question is checked by
   * running the learner's query and the reference query over a dataset and
   * comparing the rows — so a "test case" is a dataset, and a hidden one is a
   * different dataset, the way an exam is marked against an instance the
   * candidate never saw. Falls back to the question's own setup_sql.
   */
  setup?: string;
}

export interface McqOption {
  key: string;
  label: string;
}

export interface Question {
  id: string;
  subject_id: string;
  topic_id: string | null;
  title: string;
  body_md: string;
  difficulty: Difficulty;
  kind: QuestionKind;
  solution_md: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  // Phase 2 execution data
  tests: TestCase[];
  mcq_options: McqOption[];
  mcq_answer: string | null;
  setup_sql: string | null;
  /** Names for each stdin line, shown in the guided Custom input form. */
  input_labels: string[] | null;
  /** Which OPPE this question belongs to, e.g. "OPPE 1" / "OPPE 2". */
  exam: string | null;
  /** Pre-filled editor boilerplate (a def skeleton / hint), if any. */
  starter_code: string | null;
  /** Fixed authoring language (python / sql / c / java / bash). Not user-changeable. */
  language: string | null;
  /**
   * Hidden driver appended to the learner's code before running, for questions
   * that ask for a function rather than a whole program: it reads the arguments
   * from stdin as Python literals, calls the function and prints the result.
   * NULL runs the code as-is.
   */
  harness: string | null;
  /** Excluded from Test Series paper assembly (practice bank only). */
  practice_only: boolean;
}

export type TestAttemptStatus = "in_progress" | "submitted" | "expired";

/** One Test Series paper: created when it opens, closed when it's graded. */
export interface TestAttempt {
  id: string;
  user_id: string;
  subject_id: string;
  subject_slug: string;
  set_id: string;
  set_name: string;
  environment: "learning" | "exam";
  question_ids: string[];
  duration_seconds: number;
  status: TestAttemptStatus;
  score: number | null;
  total: number | null;
  time_seconds: number | null;
  leave_count: number;
  started_at: string;
  submitted_at: string | null;
}

export interface TestAnswer {
  id: string;
  attempt_id: string;
  user_id: string;
  question_id: string;
  answer: string | null;
  is_correct: boolean | null;
  q_status: "none" | "answered" | "review";
  time_spent_seconds: number;
}

export interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  status: AttemptStatus;
  time_spent_seconds: number;
  self_rating: number | null;
  is_correct: boolean | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  question_id: string;
  content_md: string;
  updated_at: string;
}

type Row<T> = T;
type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>;
        Insert: Insert<Profile, "display_name" | "created_at">;
        Update: Update<Profile>;
      };
      subjects: {
        Row: Row<Subject>;
        Insert: Insert<
          Subject,
          "id" | "description" | "is_active" | "sort_order" | "created_at"
        >;
        Update: Update<Subject>;
      };
      topics: {
        Row: Row<Topic>;
        Insert: Insert<Topic, "id" | "week" | "sort_order">;
        Update: Update<Topic>;
      };
      questions: {
        Row: Row<Question>;
        Insert: Insert<
          Question,
          | "id"
          | "topic_id"
          | "difficulty"
          | "kind"
          | "solution_md"
          | "tags"
          | "sort_order"
          | "created_at"
        >;
        Update: Update<Question>;
      };
      attempts: {
        Row: Row<Attempt>;
        Insert: Insert<
          Attempt,
          | "id"
          | "status"
          | "time_spent_seconds"
          | "self_rating"
          | "is_correct"
          | "created_at"
        >;
        Update: Update<Attempt>;
      };
      notes: {
        Row: Row<Note>;
        Insert: Insert<Note, "id" | "content_md" | "updated_at">;
        Update: Update<Note>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      difficulty_level: Difficulty;
      question_kind: QuestionKind;
      attempt_status: AttemptStatus;
    };
  };
}

/** Question row joined with its topic (used across list/detail views). */
export interface QuestionWithTopic extends Question {
  topic: Pick<Topic, "id" | "name" | "week"> | null;
}
