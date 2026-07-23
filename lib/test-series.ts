import { countedCount } from "@/lib/scoring";

export interface TestSection {
  name: string;
  week: number | null;
  questionIds: string[];
  /** Marks per question id, from the paper. Absent entries are worth 1. */
  marks?: Record<string, number>;
  /** How many of this section's questions count. null/absent = all of them. */
  bestOf?: number | null;
  /** Optional line shown under the section heading, e.g. "Solve any one". */
  note?: string | null;
}

export type TestSetCategory = "pyq" | "mock";

export interface TestSet {
  id: string;
  name: string;
  /** Previous-year paper, or a mock — they live under different sections. */
  category: TestSetCategory;
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
  /** Total marks the paper is out of, after each section's best-of rule. */
  totalMarks: number;
}

/** Marks a section can award, honouring its best-of rule. */
export function sectionMaxMarks(section: TestSection): number {
  const marksOf = (id: string) => section.marks?.[id] ?? 1;
  const all = section.questionIds.map(marksOf);
  const k = countedCount(section.bestOf ?? null, all.length);
  if (k >= all.length) return all.reduce((n, m) => n + m, 0);
  return [...all]
    .sort((a, b) => b - a)
    .slice(0, k)
    .reduce((n, m) => n + m, 0);
}

export function setTotalMarks(set: TestSet): number {
  return set.sections.reduce((n, s) => n + sectionMaxMarks(s), 0);
}

/**
 * Papers are rows now (see 0015_test_sets.sql) and are read with getTestSets().
 * What used to live here — inventing a "SET 1" from whatever coding questions a
 * subject happened to have — is gone: a real paper has a fixed title, a fixed
 * set of problems and a fixed order, none of which can be derived.
 */

export function setMeta(set: TestSet): TestSetMeta {
  return {
    id: set.id,
    name: set.name,
    available: set.available,
    sectionCount: set.sections.length,
    questionCount: set.sections.reduce((n, s) => n + s.questionIds.length, 0),
    durationSeconds: set.durationSeconds,
    totalMarks: setTotalMarks(set),
  };
}

export function formatDurationMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}
