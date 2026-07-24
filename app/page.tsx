import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CoursePickerProvider } from "@/components/curriculum/course-picker-provider";
import { SubjectBlock, BranchBlock } from "@/components/curriculum/course-blocks";
import { HomeCarousel } from "@/components/home/home-carousel";
import { HomeDemo } from "@/components/home/home-demo";
import { TopNav } from "@/components/shell/top-nav";
import { getCurriculum } from "@/lib/queries";
import { levelsForDegree, type SubjectLite } from "@/lib/curriculum";
import { JsonLd } from "@/components/seo/json-ld";
import {
  jsonLdGraph,
  websiteNode,
  organizationNode,
  faqNode,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute:
      "OPPE Practice for the IIT Madras BS Degree — PYQs & Timed Mocks",
  },
  description:
    "Prepare for the IIT Madras BS Degree OPPE with previous-year questions and full timed mock tests in Programming in Python, DBMS and more. Write and run code in your browser, get graded instantly, and climb the leaderboard.",
  alternates: { canonical: "/" },
};

// Real, on-page answers to the questions people actually search — doubles as
// FAQ structured data (rendered below and mirrored into JSON-LD).
const FAQS = [
  {
    question: "What is the IIT Madras BS Degree OPPE?",
    answer:
      "The OPPE (Online Proctored Programming Exam) is the practical, proctored exam in IIT Madras BS Degree programming courses such as Programming in Python and DBMS. IITM BS Community lets you practise for it with real question types, a timer and instant grading.",
  },
  {
    question: "How can I practise for the OPPE?",
    answer:
      "Pick a subject, solve practice questions in the in-browser editor, and take full timed mock tests that mirror the real OPPE. Your code is graded instantly against sample and hidden test cases, and your accuracy, speed and coverage are tracked over time.",
  },
  {
    question: "Are previous-year OPPE questions (PYQs) available?",
    answer:
      "Yes. You can practise previous-year OPPE questions for OPPE 1 and OPPE 2, alongside fresh mock test series set at a similar or higher difficulty.",
  },
  {
    question: "Is IITM BS Community free to use?",
    answer:
      "Yes — you can browse subjects and start practising for free. Sign in with Google to save your progress, download solutions and appear on the leaderboard.",
  },
  {
    question: "Which subjects can I practise?",
    answer:
      "Programming in Python is live now, with Database Management (DBMS) and more subjects across the Data Science and Electronic Systems branches on the way.",
  },
];

// Structured data: the site, the organisation, and the FAQ above.
const jsonLd = jsonLdGraph([websiteNode(), organizationNode(), faqNode(FAQS)]);

export default async function LandingPage() {
  const supabase = await createClient();
  const curriculum = await getCurriculum();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("slug, name, short_code, is_active")
    .order("sort_order");

  const allSubjects: SubjectLite[] = (subjects ?? []).map((s) => ({
    slug: s.slug,
    name: s.name,
    is_active: s.is_active,
  }));
  const shownSubjects = allSubjects.slice(0, 4);
  const hasMore = allSubjects.length > 4;

  // Programmes and the levels each one actually offers, straight from the
  // curriculum tables, so a new degree shows up here without a code change.
  const branches: { degreeId: string | null; name: string; note: string }[] = [
    ...curriculum.degrees.map((d) => ({
      degreeId: d.id,
      name: d.shortName,
      note: levelsForDegree(curriculum, d.id).join(" · "),
    })),
    { degreeId: null, name: "More programmes", note: "Coming soon" },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={jsonLd} />
      <TopNav right={<ProfileMenu />} />

      <CoursePickerProvider subjects={allSubjects} curriculum={curriculum}>
        <main className="flex-1">
          {/* Hero — centred */}
          <section className="mx-auto flex w-full max-w-[1500px] flex-col items-center px-3 pb-10 pt-12 text-center sm:w-[85%] sm:px-5 sm:pt-16">
            <div className="flex items-center justify-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/iitm-logo-color.svg"
                alt="IIT Madras"
                className="h-12 w-auto sm:h-14"
              />
              <p className="text-left text-[16px] font-semibold leading-tight text-fg sm:text-[18px]">
                IIT Madras Online
                <br className="hidden sm:block" /> BS Degree
              </p>
            </div>

            <h1 className="mt-4 text-[32px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[46px]">
              Practice for your{" "}
              <span className="highlight-word">OPPE Exams</span>
            </h1>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {shownSubjects.map((s) => (
                <SubjectBlock key={s.slug} subject={s} />
              ))}
              {hasMore && (
                <span className="text-[14px] text-fg-muted">and many more</span>
              )}
            </div>
          </section>

          {/* Available courses — left-aligned */}
          <section className="mx-auto w-full max-w-[1500px] px-3 pb-12 sm:w-[85%] sm:px-5">
            <h2 className="text-[22px] font-bold tracking-[-0.01em] text-fg">
              Available courses
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {branches.map((b) => (
                <BranchBlock
                  key={b.name}
                  degreeId={b.degreeId}
                  name={b.name}
                  note={b.note}
                />
              ))}
            </div>
          </section>

          {/* Feature carousel — near full width; hidden on mobile */}
          <section className="mx-auto hidden w-[95%] max-w-[1820px] px-5 pb-12 md:block">
            <HomeCarousel />
          </section>

          {/* How it works — animated product demo */}
          <section className="mx-auto w-full max-w-[1500px] px-3 pb-12 sm:w-[90%] sm:px-5">
            <HomeDemo />
          </section>

          {/* FAQ — genuine on-page content for search, mirrored as FAQ schema */}
          <section className="mx-auto w-full max-w-[1500px] px-3 pb-20 sm:w-[90%] sm:px-5">
            <h2 className="text-[22px] font-bold tracking-[-0.01em] text-fg">
              Frequently asked questions
            </h2>
            <p className="mt-1 text-[14px] text-fg-muted">
              Practising for the IIT Madras BS Degree OPPE exams.
            </p>
            <div className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {FAQS.map((f) => (
                <div key={f.question}>
                  <h3 className="text-[16px] font-semibold text-fg">
                    {f.question}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </CoursePickerProvider>

      <SiteFooter />
    </div>
  );
}
