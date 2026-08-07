import { getSubjects, getSubjectPracticeCount, getTestSets } from "@/lib/queries";

export type OppeHubKind = "practice" | "pyqs" | "test-series";

export interface OppeHubSubject {
  id: string;
  slug: string;
  name: string;
  shortCode: string;
  count: number;
  href: string;
}

/**
 * Small, public summaries for the three indexable content hubs. The underlying
 * reads use the shared content cache, so rendering these pages does not turn
 * into a per-visitor database scan.
 */
export async function getOppeHubSubjects(
  kind: OppeHubKind,
): Promise<OppeHubSubject[]> {
  const activeSubjects = (await getSubjects()).filter(
    (subject) => subject.is_active,
  );

  const subjects = await Promise.all(
    activeSubjects.map(async (subject) => {
      let count = 0;
      let href = `/app/subjects/${subject.slug}`;

      if (kind === "practice") {
        count = await getSubjectPracticeCount(subject.id);
      } else {
        const category = kind === "pyqs" ? "pyq" : "mock";
        const sets = await getTestSets(subject.id, category);
        count = sets.filter((set) => set.available).length;
        href += `?tab=${kind}`;
      }

      return {
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        shortCode: subject.short_code,
        count,
        href,
      };
    }),
  );

  return subjects.filter((subject) => subject.count > 0);
}
