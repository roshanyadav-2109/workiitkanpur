import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { SubjectLogo } from "@/components/subject-logo";

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
        {/* Hero — centred */}
        <section className="mx-auto flex w-[85%] max-w-[1500px] flex-col items-center px-5 pb-14 pt-16 text-center sm:pt-24">
          <div className="flex items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iitm-logo-color.svg"
              alt="IIT Madras"
              className="h-16 w-auto sm:h-20"
            />
            <p className="text-left text-[18px] font-semibold leading-tight text-fg sm:text-[22px]">
              IIT Madras Online
              <br className="hidden sm:block" /> BS Degree
            </p>
          </div>

          <h1 className="mt-5 text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[60px]">
            Practice for your{" "}
            <span className="highlight-word">OPPE Exams</span>
          </h1>

          {/* Subject blocks — big, with the language mark beside the name */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {shownSubjects.map((s) => (
              <Link
                key={s.slug}
                href={
                  s.is_active ? `/app/subjects/${s.slug}` : "/app/subjects"
                }
                className="group inline-flex h-16 items-center gap-3.5 rounded-md border border-hairline-strong px-6 text-[16px] font-medium transition-colors hover:bg-surface"
              >
                <SubjectLogo
                  slug={s.slug}
                  size={28}
                  className={s.is_active ? "" : "opacity-50"}
                />
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
              <span className="text-[14px] text-fg-muted">and many more</span>
            )}
          </div>
        </section>

        {/* Available Branches — centred */}
        <section className="mx-auto w-[85%] max-w-[1500px] px-5 pb-20 text-center">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.1em] text-fg-muted">
            Available Branches
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {BRANCHES.map((b) => (
              <div
                key={b.name}
                className="rounded-md border border-hairline px-4 py-6"
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
        <div className="mx-auto flex w-[85%] max-w-[1500px] items-center justify-between gap-4 px-5 py-6 text-[12px] text-fg-muted sm:px-8">
          <span>OPPE Practice</span>
          <span className="text-right">
            Independent practice tool · not affiliated with IIT Madras
          </span>
        </div>
      </footer>
    </div>
  );
}
