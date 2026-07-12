// Curriculum map for the course picker: which (degree, level) contexts each
// subject is offered in. The questions themselves are the same per subject —
// the degree/level is navigational context used to disambiguate the path in.

export interface Degree {
  id: string;
  name: string;
}

export const DEGREES: Degree[] = [
  { id: "ds", name: "Data Science & Applications" },
  { id: "es", name: "Electronic Systems" },
];

export const DEGREE_BY_ID: Record<string, Degree> = Object.fromEntries(
  DEGREES.map((d) => [d.id, d]),
);

export interface Offering {
  degree: string; // Degree.id
  level: string;
}

// Foundation courses are common to both degrees; later levels are branch-specific.
export const OFFERINGS: Record<string, Offering[]> = {
  python: [
    { degree: "ds", level: "Foundation" },
    { degree: "es", level: "Foundation" },
    { degree: "ds", level: "Diploma" },
  ],
  dbms: [{ degree: "ds", level: "Diploma" }],
  pdsa: [{ degree: "ds", level: "Diploma" }],
  java: [
    { degree: "ds", level: "Diploma" },
    { degree: "ds", level: "Degree" },
  ],
  c: [{ degree: "es", level: "Foundation" }],
  syscmd: [{ degree: "es", level: "Diploma" }],
};

export function offeringsFor(slug: string): Offering[] {
  return OFFERINGS[slug] ?? [];
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

const LEVEL_ORDER = ["Foundation", "Diploma", "Degree"];

/** Distinct levels offered in a degree (branch), in curriculum order. */
export function levelsForDegree(degreeId: string): string[] {
  return uniq(
    Object.values(OFFERINGS)
      .flat()
      .filter((o) => o.degree === degreeId)
      .map((o) => o.level),
  ).sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

/** Subject slugs offered at a specific (degree, level). */
function subjectSlugsForDegreeLevel(degreeId: string, level: string): string[] {
  return Object.keys(OFFERINGS).filter((slug) =>
    OFFERINGS[slug].some((o) => o.degree === degreeId && o.level === level),
  );
}

export function subjectSlugsForDegree(degreeId: string): string[] {
  return Object.keys(OFFERINGS).filter((slug) =>
    OFFERINGS[slug].some((o) => o.degree === degreeId),
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
  state: PickerState,
  subjects: SubjectLite[],
): PickerStep {
  // Branch-first entry: a degree is fixed with no subject yet → pick the level
  // for that branch, then a subject offered at that (degree, level). The same
  // subject can appear under different branches/levels, so it's filtered by both.
  if (state.degree && !state.subject) {
    const levels = levelsForDegree(state.degree);
    if (!state.level && levels.length > 1) {
      return { kind: "level", options: levels };
    }
    const level = state.level ?? levels[0];
    const slugs = subjectSlugsForDegreeLevel(state.degree, level);
    return {
      kind: "subject",
      options: subjects.filter((s) => slugs.includes(s.slug)),
    };
  }

  // 1. Subject-first entry — pick any subject.
  if (!state.subject) {
    return { kind: "subject", options: subjects };
  }

  let offs = offeringsFor(state.subject);
  if (offs.length === 0) return { kind: "done", subject: state.subject };
  if (state.degree) offs = offs.filter((o) => o.degree === state.degree);

  // 2. Degree.
  let degree = state.degree;
  if (!degree) {
    const degreeIds = uniq(offs.map((o) => o.degree));
    if (degreeIds.length > 1) {
      return {
        kind: "degree",
        options: degreeIds.map((id) => DEGREE_BY_ID[id]).filter(Boolean),
      };
    }
    degree = degreeIds[0];
    offs = offeringsFor(state.subject).filter((o) => o.degree === degree);
  }

  // 3. Level.
  let level = state.level;
  if (!level) {
    const levels = uniq(offs.map((o) => o.level));
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
