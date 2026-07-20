"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDurationMin, type TestSetMeta } from "@/lib/test-series";
import { usePhoneGate } from "@/components/phone/phone-gate";

export function TestSeriesList({
  slug,
  sets,
}: {
  slug: string;
  sets: TestSetMeta[];
}) {
  const router = useRouter();
  const gate = usePhoneGate();
  const live = sets.filter((s) => s.available);
  const [picking, setPicking] = useState<TestSetMeta | null>(null);

  function enter(env: "learning" | "exam") {
    if (!picking) return;
    router.push(`/app/test/${slug}/${picking.id}/run?env=${env}`);
  }

  return (
    <div className="space-y-3">
      {live.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-4 rounded-[3px] border border-accent-border/40 bg-canvas px-5 py-4"
        >
          <div className="min-w-0">
            <h3 className="text-[15.5px] font-semibold text-fg">{s.name}</h3>
            <p className="mt-1 text-[13px] text-fg-muted">
              {s.sectionCount} sections · {s.questionCount} questions ·{" "}
              {formatDurationMin(s.durationSeconds)}
            </p>
          </div>
          <button
            onClick={() => gate.requirePhone(() => setPicking(s))}
            className="inline-flex h-9 shrink-0 items-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]"
          >
            Start test →
          </button>
        </div>
      ))}

      {[2, 3].map((n) => (
        <div
          key={n}
          className="flex items-center justify-between gap-4 rounded-[3px] border border-hairline bg-surface px-5 py-4"
        >
          <div className="min-w-0">
            <h3 className="text-[15.5px] font-semibold text-fg">
              Set {n} — Full OPPE Mock
            </h3>
            <p className="mt-1 text-[13px] text-fg-muted">
              Unlocks after you finish Set {n - 1}
            </p>
          </div>
          <span className="inline-flex h-9 shrink-0 items-center rounded-[3px] bg-[#ececeb] px-5 text-[13px] font-medium text-fg-faint">
            🔒 Locked
          </span>
        </div>
      ))}

      {live.length === 0 && (
        <p className="text-[13px] text-fg-muted">
          No test sets are available for this subject yet.
        </p>
      )}

      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close"
            onClick={() => setPicking(null)}
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-md"
          />
          <div className="relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[3px] border border-hairline-strong bg-canvas shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-5">
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
                  How do you want to attempt {picking.name.split(" — ")[0]}?
                </h2>
                <p className="mt-1 text-[13px] text-fg-muted">
                  Pick your environment. You can attempt again later.
                </p>
              </div>
              <button
                onClick={() => setPicking(null)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[3px] text-fg-muted hover:bg-surface hover:text-fg"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-auto p-6 sm:grid-cols-2">
              <EnvCard
                art={<LearningArt />}
                title="Learning Environment"
                tagline="Practice at your pace"
                cta="Start learning"
                onClick={() => enter("learning")}
              />
              <EnvCard
                art={<ExamArt />}
                title="Exam Environment"
                tagline="Real OPPE conditions"
                cta="Start exam"
                onClick={() => enter("exam")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnvCard({
  art,
  title,
  tagline,
  cta,
  onClick,
}: {
  art: React.ReactNode;
  title: string;
  tagline: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-[3px] border border-hairline bg-surface p-5 text-left"
    >
      <div className="mb-5 grid h-28 place-items-center rounded-[3px] bg-canvas">
        {art}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
        {tagline}
      </div>
      <h3 className="mt-1 text-[17px] font-semibold">{title}</h3>
      <span className="mt-5 inline-flex h-9 items-center justify-center rounded-[3px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 transition-colors group-hover:from-[#7a6ae8] group-hover:to-[#6455dd]">
        {cta} →
      </span>
    </button>
  );
}

/* Artifacts — small illustrations for each environment. A hand-drawn replica of
 * Google's "waiting hourglass" illustration (no external image), in our palette. */
function LearningArt() {
  return (
    <svg width="72" height="80" viewBox="0 0 72 80" fill="none" aria-hidden>
      {/* frame — caps and side posts */}
      <rect x="15" y="8" width="42" height="6" rx="3" fill="#5a48d6" />
      <rect x="15" y="66" width="42" height="6" rx="3" fill="#5a48d6" />
      <rect x="17" y="12" width="4" height="56" rx="2" fill="#5a48d6" />
      <rect x="51" y="12" width="4" height="56" rx="2" fill="#5a48d6" />
      {/* glass — two curved bulbs meeting at the neck */}
      <path
        d="M24 15 Q26 32 36 40 Q46 32 48 15 Z"
        fill="#faf8ff"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 65 Q26 48 36 40 Q46 48 48 65 Z"
        fill="#faf8ff"
        stroke="#5a48d6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* sand — top body, animated falling grains, growing mound */}
      <path d="M27 18 Q29 31 36 37 Q43 31 45 18 Z" fill="#f59e0b" />
      <circle className="sand-fall" cx="36" cy="42" r="1.5" fill="#f59e0b" />
      <circle
        className="sand-fall"
        cx="36"
        cy="42"
        r="1.5"
        fill="#f59e0b"
        style={{ animationDelay: "0.55s" }}
      />
      <path d="M28 65 Q31 55 36 53 Q41 55 44 65 Z" fill="#f59e0b" />
    </svg>
  );
}
function ExamArt() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden>
      {/* answer sheet */}
      <rect x="14" y="8" width="30" height="40" rx="3" fill="#fff" stroke="#5a48d6" strokeWidth="2" />
      <path d="M20 18 H38 M20 24 H38 M20 30 H32" stroke="#5a48d6" strokeWidth="1.5" strokeLinecap="round" />
      {/* clock */}
      <circle cx="50" cy="38" r="13" fill="#ece8fb" stroke="#5a48d6" strokeWidth="2" />
      <path d="M50 31 V38 L55 41" stroke="#5a48d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 24 V26" stroke="#5a48d6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
