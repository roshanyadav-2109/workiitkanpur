import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

const BRANCHES: { name: string; note: string }[] = [
  { name: "Data Science & Applications", note: "Foundation · Diploma · Degree" },
  { name: "Electronic Systems", note: "Foundation · Diploma · Degree" },
  { name: "More programmes", note: "Coming soon" },
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

  const allSubjects = subjects ?? [];
  const shownSubjects = allSubjects.slice(0, 4);
  const hasMore = allSubjects.length > 4;

  const demoEnabled =
    !!process.env.NEXT_PUBLIC_DEMO_EMAIL &&
    !!process.env.NEXT_PUBLIC_DEMO_PASSWORD;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logo size={22} className="text-fg" />
          <span className="text-[15px] font-medium tracking-[-0.01em]">
            OPPE Practice
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/app"
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
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1080px] px-5 pb-12 pt-14 sm:px-8 sm:pt-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-fg-muted">
            IIT Madras BS Degree
          </p>

          <h1 className="mt-5 max-w-[16ch] text-[40px] font-semibold leading-[1.03] tracking-[-0.02em] sm:text-[64px]">
            Practice for your{" "}
            <span className="highlight-word">OPPE exams</span>
          </h1>
          <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-fg-muted sm:text-[18px]">
            Curated questions, a live timer on every attempt, and real
            in-browser code execution — built for the Online Proctored
            Programming Exam of the IIT Madras BS Degree.
          </p>

          {/* Subjects */}
          <div className="mt-9">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
              Subjects available with us
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {shownSubjects.map((s) => (
                <Link
                  key={s.slug}
                  href={s.is_active ? `/app/subjects/${s.slug}` : "/app/subjects"}
                  className="group inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] font-medium transition-colors hover:bg-surface"
                >
                  <span className={s.is_active ? "" : "text-fg-muted"}>
                    {s.name}
                  </span>
                  {!s.is_active && (
                    <span className="text-[11px] font-normal text-fg-faint">
                      soon
                    </span>
                  )}
                </Link>
              ))}
              {hasMore && (
                <span className="text-[13px] text-fg-muted">and many more</span>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={user ? "/app" : "/signup"}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {user ? "Go to dashboard" : "Start practicing"}
            </Link>
            <Link
              href="/app/subjects"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Browse questions
            </Link>
          </div>

          {!user && demoEnabled && (
            <p className="mt-4 text-[13px] text-fg-muted">
              Just exploring?{" "}
              <Link
                href="/login"
                className="text-accent underline underline-offset-2"
              >
                Open the demo account
              </Link>{" "}
              — no signup needed.
            </p>
          )}
        </section>

        {/* Available Branches */}
        <section className="mx-auto w-full max-w-[1080px] px-5 pb-20 sm:px-8">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
            Available Branches
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {BRANCHES.map((b) => (
              <div
                key={b.name}
                className="rounded-md border border-hairline px-4 py-6 sm:px-5"
              >
                <div className="text-[14px] font-medium leading-snug sm:text-[15px]">
                  {b.name}
                </div>
                <div className="mt-1.5 text-[11px] text-fg-muted sm:text-[12px]">
                  {b.note}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-5 py-6 text-[12px] text-fg-muted sm:px-8">
          <span>OPPE Practice</span>
          <span className="text-right">
            Independent practice tool · not affiliated with IIT Madras
          </span>
        </div>
      </footer>
    </div>
  );
}
