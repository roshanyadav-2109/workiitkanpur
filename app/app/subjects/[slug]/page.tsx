import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCarouselBanners,
  getCurrentUser,
  getQuestionsForSubject,
  getSubjectBySlug,
  getTopicsForSubject,
  getUserAttempts,
} from "@/lib/queries";
import { bestTimeByQuestion, statusByQuestion } from "@/lib/metrics";
import { buttonVariants } from "@/components/ui/button";
import {
  QuestionTable,
  type QuestionRow,
} from "@/components/question/question-table";
import type { QuestionStatus } from "@/components/ui/status";
import { SubjectSections } from "@/components/curriculum/subject-sections";
import { TestSeriesList } from "@/components/curriculum/test-series-list";
import { BannerCarousel } from "@/components/curriculum/banner-carousel";
import { buildSetsForSubject, setMeta } from "@/lib/test-series";

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

  const [topics, questions, banners] = await Promise.all([
    getTopicsForSubject(subject.id),
    getQuestionsForSubject(subject.id),
    getCarouselBanners(),
  ]);

  const user = await getCurrentUser();
  let status = new Map<string, QuestionStatus>();
  let best = new Map<string, number>();
  if (user) {
    const attempts = await getUserAttempts(user.id);
    status = statusByQuestion(attempts);
    best = bestTimeByQuestion(attempts);
  }

  const rows: QuestionRow[] = questions.map((q) => ({
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

  const testSets = buildSetsForSubject(questions).map(setMeta);

  return (
    <>
      {/* Image banner carousel (DB-managed) — breaks out of the page container
          to ~95vw. Slides & their links live in the carousel_banners table. */}
      {banners.length > 0 && (
        <div className="relative left-1/2 mb-8 w-[95vw] max-w-[1820px] -translate-x-1/2">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* Masthead — subject name. */}
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h1 className="text-[30px] font-semibold leading-[1.04] tracking-[-0.02em]">
            {subject.name}
          </h1>
          {user && (
            <Link
              href="/app/exam"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Timed exam
            </Link>
          )}
        </div>
      </header>

      <SubjectSections
        testSeries={<TestSeriesList slug={slug} sets={testSets} />}
      >
        <QuestionTable
          rows={rows}
          topics={topics.map((t) => ({ id: t.id, name: t.name, week: t.week }))}
          initialExam={exam}
        />
      </SubjectSections>
    </>
  );
}
