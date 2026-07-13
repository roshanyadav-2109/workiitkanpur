import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { CoursePickerProvider } from "@/components/curriculum/course-picker-provider";
import { SubjectBlock, BranchBlock } from "@/components/curriculum/course-blocks";
import { HomeCarousel } from "@/components/home/home-carousel";
import { HomeDemo } from "@/components/home/home-demo";
import { TopNav } from "@/components/shell/top-nav";
import type { SubjectLite } from "@/lib/curriculum";

const BRANCHES: { degreeId: string | null; name: string; note: string }[] = [
  {
    degreeId: "ds",
    name: "Data Science & Applications",
    note: "Foundation · Diploma · Degree",
  },
  {
    degreeId: "es",
    name: "Electronic Systems",
    note: "Foundation · Diploma · Degree",
  },
  { degreeId: null, name: "More programmes", note: "Coming soon" },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: subjects },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("subjects")
      .select("slug, name, short_code, is_active")
      .order("sort_order"),
  ]);

  const allSubjects: SubjectLite[] = (subjects ?? []).map((s) => ({
    slug: s.slug,
    name: s.name,
    is_active: s.is_active,
  }));
  const shownSubjects = allSubjects.slice(0, 4);
  const hasMore = allSubjects.length > 4;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav
        right={
          user ? (
            <Link
              href="/app/progress"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Sign up
              </Link>
            </>
          )
        }
      />

      <CoursePickerProvider subjects={allSubjects}>
        <main className="flex-1">
          {/* Hero — centred */}
          <section className="mx-auto flex w-[85%] max-w-[1500px] flex-col items-center px-5 pb-10 pt-12 text-center sm:pt-16">
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
          <section className="mx-auto w-[85%] max-w-[1500px] px-5 pb-12">
            <h2 className="text-[22px] font-bold tracking-[-0.01em] text-fg">
              Available courses
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {BRANCHES.map((b) => (
                <BranchBlock
                  key={b.name}
                  degreeId={b.degreeId}
                  name={b.name}
                  note={b.note}
                />
              ))}
            </div>
          </section>

          {/* Feature carousel — near full width, ~5% total side margin */}
          <section className="mx-auto w-[95%] max-w-[1820px] px-5 pb-12">
            <HomeCarousel />
          </section>

          {/* How it works — animated product demo */}
          <section className="mx-auto w-[90%] max-w-[1500px] px-5 pb-20">
            <HomeDemo />
          </section>
        </main>
      </CoursePickerProvider>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-[85%] max-w-[1500px] items-center justify-between gap-4 px-5 py-6 text-[12px] sm:px-8">
          <span className="text-fg-muted">IITM BS Community</span>
          <span className="text-right font-medium text-accent">
            Independent website by IITM BS Student Community — not affiliated with
            IIT Madras
          </span>
        </div>
      </footer>
    </div>
  );
}
