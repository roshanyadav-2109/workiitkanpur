// Which (degree, level) contexts each subject is offered in.
//
// The data lives in the `degrees` and `subject_offerings` tables (see
// 0014_curriculum.sql) and is read with getCurriculum(); everything here is a
// pure function over that snapshot, so server components query once and client
// components receive it as a prop.
//
// A subject is not owned by one degree: Programming in Python is Foundation in
// Data Science and Diploma in Electronic Systems, and Introduction to C
// Programming is Foundation in two different degrees. The questions are the
// same per subject — degree/level is navigational context.

export interface Degree {
  /** Stable slug: "ds", "es", "as". */
  id: string;
  /** Full title, e.g. "BS in Data Science and Applications". */
  name: string;
  /** Compact label for filters and pills, e.g. "Data Science & Applications". */
  shortName: string;
}

export interface Offering {
  subject: string; // subject slug
  degree: string; // Degree.id
  level: string; // "Foundation" | "Diploma" | "Degree"
}

export interface Curriculum {
  degrees: Degree[];
  offerings: Offering[];
}

export const EMPTY_CURRICULUM: Curriculum = { degrees: [], offerings: [] };

const LEVEL_ORDER = ["Foundation", "Diploma", "Degree"];

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function degreeById(cur: Curriculum, id: string): Degree | undefined {
  return cur.degrees.find((d) => d.id === id);
}

/** Compact label for a degree id, falling back to the raw id. */
export function degreeLabel(cur: Curriculum, id: string): string {
  return degreeById(cur, id)?.shortName ?? id;
}

export function offeringsFor(cur: Curriculum, slug: string): Offering[] {
  return cur.offerings.filter((o) => o.subject === slug);
}

export function sortLevels(levels: string[]): string[] {
  return [...levels].sort(
    (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b),
  );
}

/** Distinct levels offered in a degree (branch), in curriculum order. */
export function levelsForDegree(cur: Curriculum, degreeId: string): string[] {
  return sortLevels(
    uniq(
      cur.offerings.filter((o) => o.degree === degreeId).map((o) => o.level),
    ),
  );
}

/** Subject slugs offered at a specific (degree, level). */
function subjectSlugsForDegreeLevel(
  cur: Curriculum,
  degreeId: string,
  level: string,
): string[] {
  return uniq(
    cur.offerings
      .filter((o) => o.degree === degreeId && o.level === level)
      .map((o) => o.subject),
  );
}

export function subjectSlugsForDegree(
  cur: Curriculum,
  degreeId: string,
): string[] {
  return uniq(
    cur.offerings.filter((o) => o.degree === degreeId).map((o) => o.subject),
  );
}

export interface SubjectLite {
  slug: string;
  name: string;
  is_active: boolean;
}

export interface PickerState {
  subject?: string;
  degree?: string;
  level?: string;
}

export type PickerStep =
  | { kind: "subject"; options: SubjectLite[] }
  | { kind: "degree"; options: Degree[] }
  | { kind: "level"; options: string[] }
  | { kind: "done"; subject: string; degree?: string; level?: string };

/**
 * Given the current selections, return the next choice the learner must make,
 * auto-resolving any dimension that has only one possibility. When everything
 * is determined it returns { kind: "done" } with the resolved context.
 */
export function resolveStep(
  cur: Curriculum,
  state: PickerState,
  subjects: SubjectLite[],
): PickerStep {
  // Branch-first entry: a degree is fixed with no subject yet → pick the level
  // for that branch, then a subject offered at that (degree, level). The same
  // subject can appear under different branches/levels, so it's filtered by both.
  if (state.degree && !state.subject) {
    const levels = levelsForDegree(cur, state.degree);
    if (!state.level && levels.length > 1) {
      return { kind: "level", options: levels };
    }
    const level = state.level ?? levels[0];
    const slugs = subjectSlugsForDegreeLevel(cur, state.degree, level);
    return {
      kind: "subject",
      options: subjects.filter((s) => slugs.includes(s.slug)),
    };
  }

  // 1. Subject-first entry — pick any subject.
  if (!state.subject) {
    return { kind: "subject", options: subjects };
  }

  let offs = offeringsFor(cur, state.subject);
  if (offs.length === 0) return { kind: "done", subject: state.subject };
  if (state.degree) offs = offs.filter((o) => o.degree === state.degree);

  // 2. Degree.
  let degree = state.degree;
  if (!degree) {
    const degreeIds = uniq(offs.map((o) => o.degree));
    if (degreeIds.length > 1) {
      return {
        kind: "degree",
        options: degreeIds
          .map((id) => degreeById(cur, id))
          .filter((d): d is Degree => !!d),
      };
    }
    degree = degreeIds[0];
    offs = offeringsFor(cur, state.subject).filter((o) => o.degree === degree);
  }

  // 3. Level.
  let level = state.level;
  if (!level) {
    const levels = sortLevels(uniq(offs.map((o) => o.level)));
    if (levels.length > 1) return { kind: "level", options: levels };
    level = levels[0];
  }

  return { kind: "done", subject: state.subject, degree, level };
}

/** Destination for a fully-resolved selection. */
export function subjectHref(
  slug: string,
  degree?: string,
  level?: string,
): string {
  const params = new URLSearchParams();
  if (degree) params.set("degree", degree);
  if (level) params.set("level", level);
  const qs = params.toString();
  return `/app/subjects/${slug}${qs ? `?${qs}` : ""}`;
}
