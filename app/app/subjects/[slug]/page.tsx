import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCarouselBanners,
  getCurrentUser,
  getQuestionsForSubject,
  getSubjectBySlug,
  getTopicsForSubject,
  getUserAttempts,
  getTestAttempts,
  getCurriculum,
  getTestSets,
  type TestAttemptRow,
} from "@/lib/queries";
import { bestTimeByQuestion, statusByQuestion } from "@/lib/metrics";
import {
  QuestionTable,
  type QuestionRow,
} from "@/components/question/question-table";
import type { QuestionStatus } from "@/components/ui/status";
import { SubjectSections } from "@/components/curriculum/subject-sections";
import { TestSeriesList } from "@/components/curriculum/test-series-list";
import { BannerCarousel } from "@/components/curriculum/banner-carousel";
import { setMeta } from "@/lib/test-series";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject?.name ?? "Subject" };
}

export default async function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ exam?: string }>;
}) {
  const { slug } = await params;
  const { exam } = await searchParams;
  const subject = await getSubjectBySlug(slug);
  // is_active is the release switch — inactive subjects are not browsable.
  if (!subject || !subject.is_active) notFound();

  const [topics, questions, banners, curriculum] = await Promise.all([
    getTopicsForSubject(subject.id),
    getQuestionsForSubject(subject.id),
    getCarouselBanners(),
    getCurriculum(),
  ]);

  const user = await getCurrentUser();
  let status = new Map<string, QuestionStatus>();
  let best = new Map<string, number>();
  let pastTests: TestAttemptRow[] = [];
  if (user) {
    const [attempts, tests] = await Promise.all([
      getUserAttempts(user.id),
      getTestAttempts(user.id, slug),
    ]);
    status = statusByQuestion(attempts);
    best = bestTimeByQuestion(attempts);
    pastTests = tests;
  }

  // The Practice tab lists the practice bank. Questions that belong to a Test
  // Series paper are that paper's, and are reached by sitting it.
  const rows: QuestionRow[] = questions
    .filter((q) => q.practice_only)
    .map((q) => ({
    id: q.id,
    title: q.title,
    topicId: q.topic?.id ?? q.topic_id,
    topicName: q.topic?.name ?? null,
    week: q.topic?.week ?? null,
    kind: q.kind,
    exam: q.exam,
    tags: q.tags ?? [],
    status: status.get(q.id) ?? "unsolved",
    bestTimeSeconds: best.get(q.id) ?? null,
  }));

  const testSets = (await getTestSets(subject.id)).map(setMeta);

  return (
    <>
      {/* Image banner carousel (DB-managed) — breaks out of the page container
          to ~95vw. Slides & their links live in the carousel_banners table. */}
      {banners.length > 0 && (
        <div className="relative left-1/2 mb-8 hidden w-[95vw] max-w-[1820px] -translate-x-1/2 md:block">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* Masthead — subject name. */}
      <header className="mb-5">
        <h1 className="text-[26px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[30px]">
          {subject.name}
        </h1>
      </header>

      <SubjectSections
        testSeries={
          <TestSeriesList slug={slug} sets={testSets} past={pastTests} />
        }
      >
        <QuestionTable
          curriculum={curriculum}
          rows={rows}
          topics={topics.map((t) => ({ id: t.id, name: t.name, week: t.week }))}
          initialExam={exam}
        />
      </SubjectSections>
    </>
  );
}
