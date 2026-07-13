"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/input";

/* Bespoke tab icons (not from an icon library). */
function IconMyProgress({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="13" width="4" height="7" rx="1.2" fill="currentColor" />
      <rect x="10" y="9" width="4" height="11" rx="1.2" fill="currentColor" />
      <rect x="16" y="4.5" width="4" height="15.5" rx="1.2" fill="currentColor" />
    </svg>
  );
}
function IconMyMock({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="10" y="2" width="4" height="2.6" rx="1" fill="currentColor" />
      <circle cx="12" cy="14" r="7.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 14 V9.6 M12 14 l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TABS = [
  { mock: false, label: "My progress", Icon: IconMyProgress, url: "/app/progress" },
  { mock: true, label: "My Mock history", Icon: IconMyMock, url: "/app/progress?tab=mock" },
];

/**
 * Both panels are rendered by the server once and passed in as props; switching
 * tabs just flips which one is visible — instant, with no server round-trip or
 * data refetch. The URL is kept in sync so the tab is deep-linkable / refresh-safe.
 */
export function ProgressLayout({
  initialMock,
  rail,
  progress,
  mock,
}: {
  initialMock: boolean;
  rail: ReactNode;
  progress: ReactNode;
  mock: ReactNode;
}) {
  const [isMock, setIsMock] = useState(initialMock);

  function select(next: boolean) {
    if (next === isMock) return;
    setIsMock(next);
    window.history.replaceState(
      null,
      "",
      next ? "/app/progress?tab=mock" : "/app/progress",
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
      {/* Page sidebar — tabs + motivational rail (desktop only) */}
      <aside className="hidden lg:sticky lg:top-[74px] lg:block lg:self-start">
        <div className="flex flex-col gap-3 rounded-[10px] bg-accent-weak p-3 lg:h-[calc(100dvh-6rem)]">
          <nav className="flex flex-col gap-1">
            {TABS.map((t) => {
              const active = t.mock === isMock;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => select(t.mock)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-[8px] px-4 py-2.5 text-left text-[16px] text-fg transition-colors",
                    active ? "font-semibold" : "font-normal",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <t.Icon size={18} />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/50" />

          {rail}
        </div>
      </aside>

      {/* Content — its own tinted section (no border) */}
      <div className="rounded-[10px] bg-accent-weak p-4 sm:p-6">
        {/* Mobile: tabs become a dropdown */}
        <div className="mb-4 lg:hidden">
          <Select
            value={isMock ? "mock" : "progress"}
            onChange={(e) => select(e.target.value === "mock")}
            aria-label="Switch dashboard view"
            className="h-11 rounded-[8px] border-[#3d3d3d]! text-[15px] font-medium focus-visible:border-[#3d3d3d]!"
          >
            <option value="progress">My progress</option>
            <option value="mock">My Mock history</option>
          </Select>
        </div>
        <div className={isMock ? undefined : "hidden"}>{mock}</div>
        <div className={isMock ? "hidden" : undefined}>{progress}</div>
      </div>
    </div>
  );
}
