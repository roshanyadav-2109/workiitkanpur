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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

export const metadata: Metadata = {
  title: {
    absolute:
      "OPPE Practice for the IIT Madras BS Degree — PYQs & Timed Mocks",
  },
  description:
    "Prepare for the IIT Madras BS Degree OPPE with previous-year questions and full timed mock tests in Programming in Python, DBMS and more. Write and run code in your browser, get graded instantly, and climb the leaderboard.",
  alternates: { canonical: "/" },
};

// Structured data so search engines understand the site and organisation.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "IITM BS Community",
      description:
        "OPPE practice for the IIT Madras BS Degree — previous-year questions and timed mocks with in-browser grading.",
      inLanguage: "en-IN",
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "IITM BS Community",
      url: SITE_URL,
      logo: `${SITE_URL}/iitm-logo-color.svg`,
      description:
        "A practice platform for the IIT Madras Online BS Degree OPPE exams.",
    },
  ],
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <section className="mx-auto w-full max-w-[1500px] px-3 pb-20 sm:w-[90%] sm:px-5">
            <HomeDemo />
          </section>
        </main>
      </CoursePickerProvider>

      <SiteFooter />
    </div>
  );
}
