import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Timed on every attempt",
    body: "A stopwatch starts the moment a question opens, so practice mirrors the pressure of the proctored exam.",
  },
  {
    title: "Progress you can see",
    body: "Solved counts, time-per-question trends, accuracy by topic, and streaks — computed from your own attempts.",
  },
  {
    title: "Curated, not scraped",
    body: "Questions organised by week and difficulty, released one subject at a time. Python is live now.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <section className="mx-auto w-full max-w-[1080px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-fg-muted">
            IIT Madras BS Degree · OPPE preparation
          </p>
          <h1 className="mt-5 max-w-[18ch] text-[40px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
            Practice the OPPE until it is routine.
          </h1>
          <p className="mt-6 max-w-[58ch] text-[16px] leading-relaxed text-fg-muted">
            Curated programming questions, a timer on every attempt, and a clear
            view of your growth over time. Built for the Online Proctored
            Programming Exam — quiet, fast, and precise.
          </p>
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
              Browse subjects
            </Link>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={
                  "border-hairline px-5 py-8 sm:px-8" +
                  (i > 0 ? " border-t sm:border-l sm:border-t-0" : "")
                }
              >
                <h2 className="text-[15px] font-medium">{f.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                  {f.body}
                </p>
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
