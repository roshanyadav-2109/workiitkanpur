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
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  courseNode,
} from "@/lib/seo";
import { getSubjectContent, type SubjectContent } from "@/lib/subject-content";
import { listArticles, type ArticleMeta } from "@/lib/articles";
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
  // is_active is the release switch. A subject that isn't live yet still has a
  // real, crawlable page — it just shows a "coming soon" landing instead of the
  // practice UI. Only a non-existent subject 404s.
  if (!subject.is_active) {
    return (
      <ComingSoonSubject
        slug={slug}
        name={subject.name}
        content={getSubjectContent(slug)}
        articles={listArticles(slug)}
      />
    );
  }

  const content = getSubjectContent(slug);
  const articles = listArticles(slug);

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

  // The Practice tab lists the practice bank. Questions that belong to a Test
  // Series paper are that paper's, and are reached by sitting it — the query
  // already excludes them.
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

  // Previous-year papers and mocks are sat identically but answer different
  // questions for a learner, so each gets its own section.
  const mockSets = allSets.filter((s) => s.category === "mock").map(setMeta);
  const pyqSets = allSets.filter((s) => s.category === "pyq").map(setMeta);

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

  return (
    <>
      <JsonLd data={jsonLd} />
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
        <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-fg-muted">
          Practise {subject.name} for the IIT Madras BS Degree OPPE — solve
          previous-year questions and timed mock tests with instant in-browser
          grading.
        </p>
      </header>

      <SubjectSections
        testSeries={
          <TestSeriesList slug={slug} sets={mockSets} past={pastTests} />
        }
        pyqs={<TestSeriesList slug={slug} sets={pyqSets} past={pastTests} />}
        syllabus={content ? <SyllabusPanel content={content} /> : undefined}
        articles={
          articles.length ? <ArticlesList articles={articles} /> : undefined
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

/**
 * Crawlable landing for a subject that isn't open for practice yet (DBMS, PDSA).
 * Real keyword content so it can rank, a clear "coming soon" state, and a path
 * to the subject that IS live — never an empty practice table.
 */
function ComingSoonSubject({
  slug,
  name,
  content,
  articles,
}: {
  slug: string;
  name: string;
  content: SubjectContent | null;
  articles: ArticleMeta[];
}) {
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
      { name, path: `/app/subjects/${slug}` },
    ]),
    courseNode({
      name: `${name} — OPPE Practice`,
      description: `Practise ${name} for the IIT Madras BS Degree OPPE with previous-year questions and timed mock tests.`,
      path: `/app/subjects/${slug}`,
    }),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-accent-border/50 bg-accent-weak px-2.5 py-1 text-[12px] font-medium text-accent">
          Coming soon
        </span>
        <h1 className="mt-3 text-[26px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[32px]">
          {name} — OPPE Practice
        </h1>
      </header>

      <div className="max-w-[72ch] space-y-4 text-[15px] leading-relaxed text-fg">
        <p>
          Practise <strong>{name}</strong>{" "}
          for the IIT Madras BS Degree OPPE. We&apos;re building a full practice
          bank for this subject — previous-year questions (PYQs) and timed mock
          tests, graded instantly in your browser, just like the real OPPE.
        </p>
        <p className="text-fg-muted">
          {name}{" "}
          practice isn&apos;t open yet. It will include topic-wise questions,
          OPPE&nbsp;1 and OPPE&nbsp;2 previous-year papers, full mock test
          series, and progress tracking against the leaderboard.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/app/subjects/python"
          className="inline-flex h-10 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]"
        >
          Start with Programming in Python →
        </Link>
        <Link
          href="/app/subjects"
          className="inline-flex h-10 items-center justify-center rounded-[8px] border border-hairline-strong px-5 text-[13px] font-medium text-fg transition-colors hover:bg-surface"
        >
          Browse all subjects
        </Link>
      </div>

      {/* Real content — syllabus + articles — so this pre-launch page is worth
          ranking, not a thin placeholder. */}
      {(content || articles.length > 0) && (
        <div className="mt-14 space-y-14 border-t border-hairline pt-10">
          {content && (
            <section>
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-fg sm:text-[24px]">
                {name} OPPE syllabus
              </h2>
              <div className="mt-4">
                <SyllabusPanel content={content} />
              </div>
            </section>
          )}
          {articles.length > 0 && (
            <section>
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-fg sm:text-[24px]">
                {name}
                {" articles & guides"}
              </h2>
              <div className="mt-4">
                <ArticlesList articles={articles} />
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
