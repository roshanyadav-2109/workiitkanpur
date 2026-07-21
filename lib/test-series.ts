import type { QuestionWithTopic } from "@/lib/types";

export interface TestSection {
  name: string;
  week: number | null;
  questionIds: string[];
}

export interface TestSet {
  id: string;
  name: string;
  durationSeconds: number;
  available: boolean;
  sections: TestSection[];
}

export interface TestSetMeta {
  id: string;
  name: string;
  available: boolean;
  sectionCount: number;
  questionCount: number;
  durationSeconds: number;
}

/**
 * Assemble the live set(s) for a subject from its existing questions, grouped
 * into sections by topic. One timer covers the whole set. This is config-free —
 * a real deployment can later back this with dedicated set tables.
 */
export function buildSetsForSubject(questions: QuestionWithTopic[]): TestSet[] {
  // practice_only questions (the large OPPE practice bank) never become papers.
  const coding = questions.filter((q) => q.kind === "coding" && !q.practice_only);

  const byTopic = new Map<string, { week: number | null; ids: string[] }>();
  for (const q of coding) {
    const name = q.topic?.name ?? "Other";
    if (!byTopic.has(name)) {
      byTopic.set(name, { week: q.topic?.week ?? 99, ids: [] });
    }
    byTopic.get(name)!.ids.push(q.id);
  }

  const groups = [...byTopic.entries()].sort(
    (a, b) => (a[1].week ?? 99) - (b[1].week ?? 99),
  );

  // SET 1 — first three topics, up to 3 questions each (short and testable).
  const sections: TestSection[] = groups
    .slice(0, 3)
    .map(([name, g]) => ({
      name,
      week: g.week,
      questionIds: g.ids.slice(0, 3),
    }))
    .filter((s) => s.questionIds.length > 0);

  const questionCount = sections.reduce((n, s) => n + s.questionIds.length, 0);

  const set1: TestSet = {
    id: "set-1",
    name: "SET 1 — Full OPPE Mock",
    durationSeconds: Math.max(questionCount * 3 * 60, 15 * 60),
    available: questionCount > 0,
    sections,
  };

  return [set1];
}

export function setMeta(set: TestSet): TestSetMeta {
  return {
    id: set.id,
    name: set.name,
    available: set.available,
    sectionCount: set.sections.length,
    questionCount: set.sections.reduce((n, s) => n + s.questionIds.length, 0),
    durationSeconds: set.durationSeconds,
  };
}

export function formatDurationMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}
