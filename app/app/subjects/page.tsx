import {
  getCurrentUser,
  getMyQuestionProgress,
  getSubjectQuestionStats,
  getSubjects,
} from "@/lib/queries";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SubjectsBrowser,
  type SubjectCard,
} from "@/components/curriculum/subjects-browser";
import { offeringsFor } from "@/lib/curriculum";
import { getCurriculum } from "@/lib/queries";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  itemListNode,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "IIT Madras BS OPPE Practice Subjects",
  description:
    "Browse IIT Madras BS Degree OPPE practice by subject. Solve Python and DBMS questions, previous-year papers and timed mock tests with instant grading.",
  path: "/app/subjects",
  keywords: [
    "OPPE subjects",
    "IITM BS subjects",
    "Python OPPE practice",
    "DBMS OPPE practice",
  ],
});

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  const [subjects, stats, curriculum, progress] = await Promise.all([
    getSubjects(),
    getSubjectQuestionStats(),
    getCurriculum(),
    user ? getMyQuestionProgress() : Promise.resolve([]),
  ]);

  const statsBySubject = new Map(stats.map((row) => [row.subject_id, row]));
  const solvedBySubject = new Map<string, number>();
  for (const row of progress) {
    if (row.status !== "solved") continue;
    solvedBySubject.set(
      row.subject_id,
      (solvedBySubject.get(row.subject_id) ?? 0) + 1,
    );
  }

  const cards: SubjectCard[] = subjects.map((s) => {
    const subjectStats = statsBySubject.get(s.id);
    const offerings = offeringsFor(curriculum, s.slug);
    // Group offerings by branch so each (branch → its levels) is one display row.
    const byBranch = new Map<string, string[]>();
    for (const o of offerings) {
      const levels = byBranch.get(o.degree) ?? [];
      if (!levels.includes(o.level)) levels.push(o.level);
      byBranch.set(o.degree, levels);
    }
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      active: s.is_active,
      total: subjectStats?.total ?? 0,
      solved: solvedBySubject.get(s.id) ?? 0,
      showProgress: !!user,
      exams: subjectStats?.exams ?? [],
      branches: Array.from(new Set(offerings.map((o) => o.degree))),
      levels: Array.from(new Set(offerings.map((o) => o.level))),
      offerings: Array.from(byBranch, ([branch, levels]) => ({
        branch,
        levels,
      })),
    };
  });

  const activeCards = cards.filter((c) => c.active);
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
    ]),
    itemListNode(
      activeCards.map((c) => ({
        name: c.name,
        path: `/app/subjects/${c.slug}`,
      })),
    ),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      {cards.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Content is on its way. Check back shortly."
        />
      ) : (
        <SubjectsBrowser cards={cards} curriculum={curriculum} />
      )}
    </>
  );
}
