import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCarouselBanners,
  getCurrentUser,
  getSubjectQuestionList,
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
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  courseNode,
} from "@/lib/seo";
import { getSubjectContent } from "@/lib/subject-content";
import { listArticles } from "@/lib/articles";
import {
  SyllabusPanel,
  ArticlesList,
} from "@/components/curriculum/subject-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  // Only a slug that isn't a real subject stays out of search. Every real
  // subject is indexed with the same normal, keyword-rich snippet — whether or
  // not practice is live yet — so search results never reveal "coming soon".
  if (!subject) {
    return pageMetadata({
      title: "Subject",
      description: "Practice subject for the IIT Madras BS Degree OPPE.",
      path: `/app/subjects/${slug}`,
      index: false,
    });
  }
  return pageMetadata({
    title: `${subject.name} — OPPE Practice`,
    description: `Practise ${subject.name} for the IIT Madras BS Degree OPPE. Solve previous-year questions (PYQs) and full timed mock tests, write code in your browser, and get graded instantly.`,
    path: `/app/subjects/${slug}`,
    keywords: [
      `${subject.name} OPPE`,
      `${subject.name} OPPE practice`,
      `${subject.name} previous year questions`,
      `${subject.name} quiz`,
      `${subject.name} mock test`,
    ],
  });
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
  if (!subject) notFound();

  // is_active is the release switch. A subject that isn't live yet uses the very
  // same page framework — its Practice / Test Series / PYQs tabs just show a
  // "coming soon" state, while Syllabus and Articles carry real content.
  const live = subject.is_active;
  const content = getSubjectContent(slug);
  const articles = listArticles(slug);

  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
      { name: subject.name, path: `/app/subjects/${slug}` },
    ]),
    courseNode({
      name: `${subject.name} — OPPE Practice`,
      description: `Practise ${subject.name} for the IIT Madras BS Degree OPPE with previous-year questions and timed mock tests.`,
      path: `/app/subjects/${slug}`,
    }),
  ]);

  // The practice bank, test series and banners only exist for a live subject.
  let bannerNode: ReactNode = null;
  let practiceNode: ReactNode = null;
  let testSeriesNode: ReactNode = undefined;
  let pyqNode: ReactNode = undefined;

  if (live) {
    const [topics, questions, banners, curriculum, allSets, user] =
      await Promise.all([
        getTopicsForSubject(subject.id),
        getSubjectQuestionList(subject.id),
        getCarouselBanners(),
        getCurriculum(),
        getTestSets(subject.id),
        getCurrentUser(),
      ]);
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

    const rows: QuestionRow[] = questions.map((q) => ({
      id: q.id,
      title: q.title,
      topicId: q.topic?.id ?? q.topic_id,
      topicName: q.topic?.name ?? null,
      week: q.topic?.week ?? null,
      kind: q.kind,
      exam: q.exam,
      difficulty: q.difficulty,
      tags: q.tags ?? [],
      status: status.get(q.id) ?? "unsolved",
      bestTimeSeconds: best.get(q.id) ?? null,
    }));
    const mockSets = allSets.filter((s) => s.category === "mock").map(setMeta);
    const pyqSets = allSets.filter((s) => s.category === "pyq").map(setMeta);

    bannerNode =
      banners.length > 0 ? (
        <div className="relative left-1/2 mb-8 hidden w-[95vw] max-w-[1820px] -translate-x-1/2 md:block">
          <BannerCarousel banners={banners} />
        </div>
      ) : null;
    testSeriesNode = (
      <TestSeriesList slug={slug} sets={mockSets} past={pastTests} />
    );
    pyqNode = <TestSeriesList slug={slug} sets={pyqSets} past={pastTests} />;
    practiceNode = (
      <QuestionTable
        curriculum={curriculum}
        rows={rows}
        topics={topics.map((t) => ({ id: t.id, name: t.name, week: t.week }))}
        initialExam={exam}
      />
    );
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      {bannerNode}

      {/* Masthead — subject name, with a "coming soon" tag before launch. */}
      <header className="mb-5">
        {!live && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-accent-border/50 bg-accent-weak px-2.5 py-1 text-[12px] font-medium text-accent">
              Coming soon
            </span>
          </div>
        )}
        <h1 className="text-[26px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[30px]">
          {subject.name}
        </h1>
      </header>

      <SubjectSections
        live={live}
        testSeries={testSeriesNode}
        pyqs={pyqNode}
        syllabus={content ? <SyllabusPanel content={content} /> : undefined}
        articles={
          articles.length ? <ArticlesList articles={articles} /> : undefined
        }
      >
        {practiceNode}
      </SubjectSections>
    </>
  );
}
