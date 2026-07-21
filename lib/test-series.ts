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
  };
}

export function formatDurationMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}
