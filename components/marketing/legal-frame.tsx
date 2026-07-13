import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TopNav } from "@/components/shell/top-nav";

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

/** Wide, company-style layout for legal pages: header band, sticky contents
 *  rail, and numbered sections that use the full width of the site. */
export function LegalFrame({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav
        right={
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
        }
      />

      {/* header band */}
      <div className="border-b border-hairline">
        <div className="mx-auto w-[92%] max-w-[1240px] py-10 sm:py-12">
          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 text-[13px] text-fg-muted">Last updated {updated}</p>
        </div>
      </div>

      <main className="mx-auto w-[92%] max-w-[1240px] flex-1 py-12 sm:py-14">
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[260px_1fr]">
          {/* contents rail */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <div className="text-[11.5px] font-normal uppercase tracking-[0.08em] text-fg-muted">
              On this page
            </div>
            <nav className="mt-3.5 flex flex-col gap-2.5 border-l border-hairline pl-4">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-[13.5px] leading-snug text-fg-muted transition-colors hover:text-fg"
                >
                  {i + 1}. {s.heading}
                </a>
              ))}
            </nav>
          </aside>

          {/* body */}
          <article className="max-w-[820px]">
            {intro && (
              <p className="text-[15.5px] leading-[1.75] text-fg-muted">{intro}</p>
            )}
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mt-10 scroll-mt-24 first:mt-8">
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-fg">
                  {i + 1}. {s.heading}
                </h2>
                <div className="mt-3 space-y-4 text-[15.5px] leading-[1.75] text-fg">
                  {s.body}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-[92%] max-w-[1240px] items-center justify-between gap-4 py-6 text-[12px]">
          <span className="text-fg-muted">IITM BS Community</span>
          <span className="rounded-full bg-accent px-3 py-1 font-medium text-white">
            Independent website by IITM BS Student Community — not affiliated with
            IIT Madras
          </span>
        </div>
      </footer>
    </div>
  );
}
