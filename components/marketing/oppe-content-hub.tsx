import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TopNav } from "@/components/shell/top-nav";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { SubjectLogo } from "@/components/subject-logo";
import type { OppeHubKind, OppeHubSubject } from "@/lib/oppe-hubs";

const COPY = {
  practice: {
    index: "01",
    eyebrow: "BUILD EXAM MUSCLE",
    title: "OPPE practice, organised by subject.",
    mobileTitle: ["OPPE practice,", "organised by subject."],
    description:
      "Move from topic-wise questions to a complete solution. Write code in the browser, run it against test cases and return exactly where you stopped.",
    unit: "practice question",
    pluralUnit: "practice questions",
    cardAction: "Open practice bank",
    facts: [
      "Topic-wise problem banks",
      "Sample and hidden test cases",
      "Saved progress after sign-in",
    ],
    steps: [
      ["Pick the weak topic", "Start with the subject and topic costing you marks."],
      ["Write and run", "Use the built-in editor and check the real program output."],
      ["Fix the edge cases", "Submit only after the sample and hidden cases are covered."],
    ],
  },
  pyqs: {
    index: "02",
    eyebrow: "READ THE REAL PATTERN",
    title: "Previous OPPE papers, in exam order.",
    mobileTitle: ["Previous OPPE", "papers, in", "exam order."],
    description:
      "Work through available previous-year question papers with their original sections, marks and timing structure instead of a shuffled practice list.",
    unit: "previous-year paper",
    pluralUnit: "previous-year papers",
    cardAction: "Browse subject PYQs",
    facts: [
      "Paper-wise question order",
      "Original sections where known",
      "Marks and duration kept together",
    ],
    steps: [
      ["Choose a paper", "Select the subject, OPPE and available exam session."],
      ["Attempt in order", "Follow the paper structure before checking solutions."],
      ["Review the pattern", "Note repeated concepts and the questions that took longest."],
    ],
  },
  "test-series": {
    index: "03",
    eyebrow: "REHEARSE UNDER TIME",
    title: "A proper OPPE test-series run.",
    mobileTitle: ["A proper OPPE", "test-series run."],
    description:
      "Sit complete mock papers with a countdown, question palette and end-of-test grading so exam-day navigation and time pressure feel familiar.",
    unit: "timed mock",
    pluralUnit: "timed mocks",
    cardAction: "Open test series",
    facts: [
      "Full timed mock papers",
      "Question palette and countdown",
      "Score and attempt review",
    ],
    steps: [
      ["Set up like exam day", "Use a desktop, clear distractions and start the timer."],
      ["Control the clock", "Move between questions without losing your place."],
      ["Review the result", "Use the score and failed cases to plan the next session."],
    ],
  },
} as const;

export function OppeContentHub({
  kind,
  subjects,
  jsonLd,
}: {
  kind: OppeHubKind;
  subjects: OppeHubSubject[];
  jsonLd: object;
}) {
  const copy = COPY[kind];
  const total = subjects.reduce((sum, subject) => sum + subject.count, 0);
  const unit = total === 1 ? copy.unit : copy.pluralUnit;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-canvas">
      <JsonLd data={jsonLd} />
      <TopNav right={<ProfileMenu />} />

      <main className="flex-1">
        <section className="overflow-hidden border-b border-[#3d3d3d] bg-[#17151f] text-white">
          <div className="mx-auto grid w-full min-w-0 max-w-[1320px] gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_280px] lg:items-end">
            <div className="min-w-0">
              <p className="font-mono text-[12px] font-semibold tracking-[0.18em] text-[#b9adff]">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] break-words font-serif text-[36px] font-semibold leading-[0.98] tracking-[-0.035em] sm:w-auto sm:max-w-[820px] sm:text-[64px]">
                <span className="sm:hidden">
                  {copy.mobileTitle.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
                <span className="hidden sm:inline">{copy.title}</span>
              </h1>
              <p className="mt-6 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] break-words text-[16px] leading-7 text-white/70 sm:w-auto sm:max-w-[760px] sm:text-[18px]">
                {copy.description}
              </p>
            </div>

            <div className="border-l border-white/25 pl-6">
              <div className="font-mono text-[54px] font-semibold leading-none text-[#f2d98a]">
                {copy.index}
                <span className="text-[20px] text-white/40">/03</span>
              </div>
              <p className="mt-4 text-[13px] uppercase tracking-[0.12em] text-white/50">
                Available now
              </p>
              <p className="mt-1 text-[20px] font-semibold">
                {total.toLocaleString("en-IN")} {unit}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside>
              <p className="font-mono text-[12px] font-semibold tracking-[0.14em] text-accent">
                WHAT YOU GET
              </p>
              <ul className="mt-4 space-y-3 text-[14px] leading-6 text-fg-muted">
                {copy.facts.map((fact, index) => (
                  <li key={fact} className="flex gap-3">
                    <span className="font-mono text-accent">0{index + 1}</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </aside>

            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[13px] text-fg-muted">Choose a subject</p>
                  <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.025em] text-fg">
                    Available OPPE material
                  </h2>
                </div>
                <Link
                  href="/app/subjects"
                  className="hidden text-[13px] font-semibold text-accent hover:underline sm:inline"
                >
                  View all subjects →
                </Link>
              </div>

              {subjects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjects.map((subject) => (
                    <article
                      key={subject.id}
                      className="group flex min-h-[210px] flex-col border border-[#3d3d3d] bg-canvas p-5 transition-transform duration-200 hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid h-11 w-11 place-items-center rounded-[6px] bg-surface">
                          <SubjectLogo slug={subject.slug} size={25} />
                        </span>
                        <span className="font-mono text-[11px] tracking-[0.12em] text-fg-faint">
                          {subject.shortCode}
                        </span>
                      </div>
                      <h2 className="mt-5 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-fg">
                        {subject.name}
                      </h2>
                      <p className="mt-1 text-[13px] text-fg-muted">
                        {subject.count} {subject.count === 1 ? copy.unit : copy.pluralUnit}
                      </p>
                      <Link
                        href={subject.href}
                        className="mt-auto pt-6 text-[13px] font-semibold text-accent group-hover:underline"
                      >
                        {copy.cardAction} →
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-[#3d3d3d] px-5 py-10 text-[14px] text-fg-muted">
                  This collection is being prepared. Use the subject browser to
                  see the material that is already live.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-[#3d3d3d] bg-surface">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
            <p className="font-mono text-[12px] font-semibold tracking-[0.14em] text-accent">
              A BETTER ATTEMPT LOOP
            </p>
            <div className="mt-7 grid gap-px overflow-hidden border border-[#3d3d3d] bg-[#3d3d3d] md:grid-cols-3">
              {copy.steps.map(([title, description], index) => (
                <div key={title} className="bg-canvas p-6 sm:p-8">
                  <span className="font-mono text-[12px] text-accent">
                    STEP 0{index + 1}
                  </span>
                  <h2 className="mt-5 text-[20px] font-semibold tracking-[-0.015em] text-fg">
                    {title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-fg-muted">
                    {description}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-7 max-w-[820px] text-[12px] leading-5 text-fg-faint">
              Independent student-run practice resource. Not affiliated with,
              endorsed by or an official product of IIT Madras.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
