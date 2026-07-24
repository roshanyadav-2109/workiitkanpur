import {
  getAllQuestionsMinimal,
  getCurrentUser,
  getSubjects,
  getUserAttempts,
} from "@/lib/queries";
import { statusByQuestion } from "@/lib/metrics";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SubjectsBrowser,
  type SubjectCard,
} from "@/components/curriculum/subjects-browser";
import { offeringsFor } from "@/lib/curriculum";
import { getCurriculum } from "@/lib/queries";
import type { QuestionStatus } from "@/components/ui/status";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  itemListNode,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Practice Subjects",
  description:
    "Browse every subject you can practise for the IIT Madras BS Degree OPPE — Programming in Python, DBMS and more. Solve questions and take timed mock tests with instant in-browser grading.",
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
  const [subjects, questions, curriculum] = await Promise.all([
    getSubjects(),
    getAllQuestionsMinimal(),
    getCurriculum(),
  ]);

  let status = new Map<string, QuestionStatus>();
  if (user) {
    const attempts = await getUserAttempts(user.id);
    status = statusByQuestion(attempts);
  }

  const cards: SubjectCard[] = subjects.map((s) => {
    const qs = questions.filter((q) => q.subject_id === s.id);
    const solved = qs.filter((q) => status.get(q.id) === "solved").length;
    const exams = Array.from(
      new Set(qs.map((q) => q.exam).filter((e): e is string => !!e)),
    ).sort();
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
      total: qs.length,
      solved,
      showProgress: !!user,
      exams,
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
