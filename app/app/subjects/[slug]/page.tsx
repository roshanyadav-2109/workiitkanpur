import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCarouselBanners,
  getCurrentUser,
  getSubjectQuestionPage,
  getSubjectBySlug,
  getTopicsForSubject,
  getUserAttemptsForSubject,
  getTestAttempts,
  getCurriculum,
  getTestSets,
} from "@/lib/queries";
import { QuestionTable } from "@/components/question/question-table";
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
import {
  getSubjectContent,
  getSubjectResources,
  hasSubjectContent,
  hasSubjectResources,
} from "@/lib/subject-content";
import { hasArticles, listArticles } from "@/lib/articles";
import {
  SyllabusPanel,
  ArticlesList,
  ResourcesPanel,
} from "@/components/curriculum/subject-content";
import {
  QUESTION_BATCH_SIZE,
  questionProgress,
  questionRows,
} from "@/lib/question-list-data";

const SECTION_IDS = [
  "practice",
  "test-series",
  "pyqs",
  "resources",
  "syllabus",
  "articles",
] as const;
type SectionId = (typeof SECTION_IDS)[number];

function isSectionId(value: string | undefined): value is SectionId {
  return SECTION_IDS.some((section) => section === value);
}

function QuestionListSkeleton() {
  return (
    <div aria-label="Loading questions" className="animate-pulse">
      <div className="mb-5 grid grid-cols-2 gap-2 sm:flex">
        <div className="h-11 rounded-[8px] bg-surface sm:w-40" />
        <div className="h-11 rounded-[8px] bg-surface sm:w-40" />
        <div className="col-span-2 h-11 rounded-[8px] bg-surface sm:flex-1" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-[74px] rounded-[8px] border border-hairline bg-surface"
          />
        ))}
      </div>
    </div>
  );
}

async function SubjectBanner() {
  const banners = await getCarouselBanners();
  if (banners.length === 0) return null;
  return (
    <div className="relative left-1/2 mb-8 hidden w-[95vw] max-w-[1820px] -translate-x-1/2 md:block">
      <BannerCarousel banners={banners} />
    </div>
  );
}

async function PracticeTab({
  subjectId,
  subjectSlug,
  initialExam,
}: {
  subjectId: string;
  subjectSlug: string;
  initialExam?: string;
}) {
  const userPromise = getCurrentUser();
  const attemptsPromise = userPromise.then((user) =>
    user ? getUserAttemptsForSubject(user.id, subjectId) : [],
  );
  const [topics, page, curriculum, attempts] = await Promise.all([
    getTopicsForSubject(subjectId),
    getSubjectQuestionPage(subjectId, 0, QUESTION_BATCH_SIZE),
    getCurriculum(),
    attemptsPromise,
  ]);
  const progress = questionProgress(attempts);

  return (
    <QuestionTable
      subjectSlug={subjectSlug}
      curriculum={curriculum}
      rows={questionRows(page.questions, progress)}
      topics={topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        week: topic.week,
      }))}
      initialExam={initialExam}
      initialHasMore={page.hasMore}
      progress={progress}
    />
  );
}

async function TestTab({
  subjectId,
  subjectSlug,
  category,
}: {
  subjectId: string;
  subjectSlug: string;
  category: "mock" | "pyq";
}) {
  const userPromise = getCurrentUser();
  const pastPromise = userPromise.then((user) =>
    user ? getTestAttempts(user.id, subjectSlug) : [],
  );
  const [sets, past] = await Promise.all([
    getTestSets(subjectId, category),
    pastPromise,
  ]);
  const setIds = new Set(sets.map((set) => set.id));

  return (
    <TestSeriesList
      slug={subjectSlug}
      sets={sets.map(setMeta)}
      past={past.filter((attempt) => setIds.has(attempt.set_id))}
    />
  );
}

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
    title: subject.name,
    description: `Practise ${subject.name} for the IIT Madras BS Degree OPPE. Solve previous-year questions (PYQs) and full timed mock tests, write code, and get graded instantly.`,
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
  searchParams: Promise<{ exam?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { exam, tab } = await searchParams;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  // is_active is the release switch. A subject that isn't live yet uses the very
  // same page framework — its Practice / Test Series / PYQs tabs just show a
  // "coming soon" state, while Syllabus and Articles carry real content.
  const live = subject.is_active;
  const syllabusAvailable = hasSubjectContent(slug);
  const articlesAvailable = hasArticles(slug);
  const resourcesAvailable = hasSubjectResources(slug);
  const defaultSection: SectionId = live
    ? "practice"
    : syllabusAvailable
      ? "syllabus"
      : articlesAvailable
        ? "articles"
        : "practice";
  const activeSection = isSectionId(tab) ? tab : defaultSection;
  const availableSections = [
    ...(live ? ["practice", "test-series", "pyqs"] : []),
    ...(resourcesAvailable ? ["resources"] : []),
    ...(syllabusAvailable ? ["syllabus"] : []),
    ...(articlesAvailable ? ["articles"] : []),
  ];

  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Subjects", path: "/app/subjects" },
      { name: subject.name, path: `/app/subjects/${slug}` },
    ]),
    courseNode({
      name: subject.name,
      description: `Practise ${subject.name} for the IIT Madras BS Degree OPPE with previous-year questions and timed mock tests.`,
      path: `/app/subjects/${slug}`,
    }),
  ]);

  // Only construct the selected tab. Slow database work sits inside a Suspense
  // boundary so unrelated tabs never join the current request.
  let practiceNode: ReactNode = null;
  let testSeriesNode: ReactNode = undefined;
  let pyqNode: ReactNode = undefined;
  let syllabusNode: ReactNode = undefined;
  let articlesNode: ReactNode = undefined;
  let resourcesNode: ReactNode = undefined;

  if (live && activeSection === "practice") {
    practiceNode = (
      <Suspense fallback={<QuestionListSkeleton />}>
        <PracticeTab
          subjectId={subject.id}
          subjectSlug={slug}
          initialExam={exam}
        />
      </Suspense>
    );
  } else if (live && activeSection === "test-series") {
    testSeriesNode = (
      <Suspense fallback={<QuestionListSkeleton />}>
        <TestTab subjectId={subject.id} subjectSlug={slug} category="mock" />
      </Suspense>
    );
  } else if (live && activeSection === "pyqs") {
    pyqNode = (
      <Suspense fallback={<QuestionListSkeleton />}>
        <TestTab subjectId={subject.id} subjectSlug={slug} category="pyq" />
      </Suspense>
    );
  } else if (activeSection === "syllabus") {
    const content = getSubjectContent(slug);
    syllabusNode = content ? <SyllabusPanel content={content} /> : undefined;
  } else if (activeSection === "articles") {
    const articles = listArticles(slug);
    articlesNode = articles.length ? (
      <ArticlesList articles={articles} />
    ) : undefined;
  } else if (activeSection === "resources") {
    const resourcesMd = getSubjectResources(slug);
    resourcesNode = resourcesMd ? (
      <ResourcesPanel markdown={resourcesMd} />
    ) : undefined;
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      {live && (
        <Suspense
          fallback={
            <div className="relative left-1/2 mb-8 hidden h-[340px] w-[95vw] max-w-[1820px] -translate-x-1/2 animate-pulse rounded-[10px] bg-surface md:block" />
          }
        >
          <SubjectBanner />
        </Suspense>
      )}

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
        key={`${slug}:${activeSection}`}
        live={live}
        activeSection={activeSection}
        availableSections={availableSections}
        testSeries={testSeriesNode}
        pyqs={pyqNode}
        syllabus={syllabusNode}
        articles={articlesNode}
        resources={resourcesNode}
      >
        {practiceNode}
      </SubjectSections>
    </>
  );
}
