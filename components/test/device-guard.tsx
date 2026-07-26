"use client";

import { useEffect, useState } from "react";

/**
 * The exam environment can only run on a laptop/desktop: it is the real,
 * timed, tab-watched paper, so it needs a keyboard and mouse and a proper
 * screen. Learning mode is untimed self-paced practice and is allowed on any
 * device, so the guard only blocks when `enforce` is set.
 *
 * The check blocks small screens and — even when a phone requests the "desktop
 * site" (which fakes a wide viewport) — touch-only devices with no fine pointer
 * (mouse/trackpad).
 */
export function TestDeviceGuard({
  enforce,
  children,
}: {
  enforce: boolean;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enforce) {
      setOk(true);
      return;
    }
    function check() {
      const wideEnough = window.innerWidth >= 1024;
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      // A phone/tablet (even in "desktop site" mode) reports a coarse pointer
      // and no fine pointer; a real laptop has a mouse/trackpad (fine pointer).
      const touchOnly = coarsePointer && !finePointer;
      setOk(wideEnough && !touchOnly);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [enforce]);

  if (ok === null) return null; // avoid a flash before the check runs
  if (ok) return <>{children}</>;

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] place-items-center px-6 py-16 text-center">
      <div className="max-w-xs">
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          fill="none"
          aria-hidden
          className="mx-auto"
        >
          <circle cx="64" cy="64" r="60" fill="#efecfb" />
          {/* laptop screen */}
          <rect
            x="30"
            y="40"
            width="55"
            height="38"
            rx="4.5"
            fill="#fff"
            stroke="#5a48d6"
            strokeWidth="3.5"
          />
          {/* lines of the exam on screen */}
          <path
            d="M39 52h29M39 60h29M39 68h17"
            stroke="#5a48d6"
            strokeOpacity="0.4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* laptop base */}
          <rect x="22" y="82" width="71" height="8" rx="4" fill="#5a48d6" />
          {/* a timer badge — it's a timed paper */}
          <circle cx="90" cy="46" r="14" fill="#fff" stroke="#5a48d6" strokeWidth="3.5" />
          <path
            d="M90 38.5V46l5 3.5"
            stroke="#5a48d6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.01em]">
          Open on a laptop
        </h1>
        <p className="mx-auto mt-2 max-w-[26ch] text-[14px] leading-relaxed text-fg-muted">
          This timed exam needs a computer with a keyboard. Switch to a laptop
          or desktop to begin.
        </p>
      </div>
    </div>
  );
}
