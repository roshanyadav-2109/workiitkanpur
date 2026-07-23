/**
 * Paper scoring.
 *
 * Kept free of Supabase and React so the marking rules can be reasoned about —
 * and tested — on their own. Every knob here is data loaded from the paper
 * (marks per question, best_of per section); nothing about a particular exam is
 * encoded in this file.
 */

export interface ScoredQuestion {
  questionId: string;
  correct: boolean;
  /** Weight of this question. Treated as 1 when the paper doesn't say. */
  marks: number;
}

export interface ScoredSection {
  name: string;
  /** How many questions count. null = all of them. 1 = "solve any one". */
  bestOf: number | null;
  questions: ScoredQuestion[];
}

export interface SectionResult {
  name: string;
  bestOf: number | null;
  /** Marks the learner earned in this section. */
  score: number;
  /** The most this section could award. */
  total: number;
  /** Questions whose marks were actually counted (best_of drops the rest). */
  countedQuestionIds: string[];
}

export interface PaperResult {
  score: number;
  total: number;
  sections: SectionResult[];
}

/**
 * How many of a section's questions count, given its rule and its size.
 * Out-of-range or missing values fall back to "all of them", which is the
 * conservative reading: a mis-configured paper marks everything rather than
 * silently discarding a student's work.
 */
export function countedCount(bestOf: number | null, n: number): number {
  if (bestOf == null || !Number.isFinite(bestOf)) return n;
  const k = Math.floor(bestOf);
  if (k < 1) return n;
  return Math.min(k, n);
}

function scoreSection(section: ScoredSection): SectionResult {
  const qs = section.questions.map((q) => ({
    ...q,
    marks: Number.isFinite(q.marks) && q.marks > 0 ? q.marks : 1,
    earned: q.correct ? (Number.isFinite(q.marks) && q.marks > 0 ? q.marks : 1) : 0,
  }));
  const k = countedCount(section.bestOf, qs.length);

  // Every question counts — the common case.
  if (k >= qs.length) {
    return {
      name: section.name,
      bestOf: section.bestOf,
      score: qs.reduce((n, q) => n + q.earned, 0),
      total: qs.reduce((n, q) => n + q.marks, 0),
      countedQuestionIds: qs.map((q) => q.questionId),
    };
  }

  // "Best k of n": take the k highest-scoring answers. The section's maximum is
  // the k highest-marked questions in it — not the k the learner happened to
  // answer — so the paper is always out of the same total for everyone.
  const best = [...qs]
    .sort((a, b) => b.earned - a.earned || b.marks - a.marks)
    .slice(0, k);
  const totalCap = [...qs]
    .sort((a, b) => b.marks - a.marks)
    .slice(0, k)
    .reduce((n, q) => n + q.marks, 0);

  return {
    name: section.name,
    bestOf: section.bestOf,
    score: best.reduce((n, q) => n + q.earned, 0),
    total: totalCap,
    countedQuestionIds: best.map((q) => q.questionId),
  };
}

export function scorePaper(sections: ScoredSection[]): PaperResult {
  const results = sections.map(scoreSection);
  return {
    score: results.reduce((n, s) => n + s.score, 0),
    total: results.reduce((n, s) => n + s.total, 0),
    sections: results,
  };
}

/** "Solve any one", "Best 2 of 4" — the rule, in words, for the student. */
export function describeSectionRule(
  bestOf: number | null,
  questionCount: number,
): string | null {
  if (bestOf == null) return null;
  const k = countedCount(bestOf, questionCount);
  if (k >= questionCount) return null;
  if (k === 1) return "Solve any one";
  return `Best ${k} of ${questionCount}`;
}
