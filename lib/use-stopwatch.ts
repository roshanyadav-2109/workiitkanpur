"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wall-clock stopwatch. Anchors to a timestamp on each run so elapsed time
 * stays accurate even when the tab is backgrounded and setInterval throttles.
 * The anchor lives in a ref that `reset()` also updates, so resetting while the
 * timer is running is not clobbered by the interval's next tick.
 *
 * Pass `storageKey` to survive a reload: the elapsed count is written there as
 * it ticks and read back on mount. It is restored in an effect rather than in
 * the initial state so the server and the first client render agree.
 */
export function useStopwatch(
  initialSeconds = 0,
  autoStart = true,
  storageKey?: string,
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const secondsRef = useRef(initialSeconds);
  secondsRef.current = seconds;
  const anchorRef = useRef<{ at: number; base: number } | null>(null);

  useEffect(() => {
    if (!running) {
      anchorRef.current = null;
      return;
    }
    // Count only while the tab is actually visible. The anchor holds the start
    // instant plus the seconds already banked; it's null while the tab is
    // hidden, so background time (leaving the tab open overnight, switching
    // away for a day) is never added. A refresh restores the banked value via
    // the storage effect below, so it resumes rather than resets.
    const anchorNow = () => {
      anchorRef.current = { at: Date.now(), base: secondsRef.current };
    };
    const hidden = typeof document !== "undefined" && document.hidden;
    if (hidden) anchorRef.current = null;
    else anchorNow();

    const tick = () => {
      const anchor = anchorRef.current;
      if (!anchor) return; // paused while hidden
      setSeconds(anchor.base + Math.floor((Date.now() - anchor.at) / 1000));
    };
    const onVisibility = () => {
      if (document.hidden) {
        // Bank the elapsed seconds and stop the clock while away.
        const anchor = anchorRef.current;
        if (anchor) {
          const banked =
            anchor.base + Math.floor((Date.now() - anchor.at) / 1000);
          secondsRef.current = banked;
          setSeconds(banked);
          anchorRef.current = null;
        }
      } else {
        // Resume from the banked value, not from where we left the clock.
        anchorNow();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(tick, 250);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running]);

  // Restore on mount, and again whenever the key changes (moving to another
  // question). Declared after the interval effect so it wins the race to set
  // the anchor, otherwise the first tick would overwrite the restored value.
  // Set by a restore so the very next persist is skipped. Without it that
  // persist runs with the seconds of the render that triggered the restore —
  // zero on mount, or the previous question's time when the key changes — and
  // writes it straight back over the value just read.
  const skipPersist = useRef(false);

  useEffect(() => {
    if (!storageKey) return;
    let stored = 0;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const n = raw ? parseInt(raw, 10) : NaN;
      if (Number.isFinite(n) && n >= 0) stored = n;
    } catch {
      /* private mode / storage disabled — just start from zero */
    }
    skipPersist.current = true;
    secondsRef.current = stored;
    setSeconds(stored);
    if (anchorRef.current) anchorRef.current = { at: Date.now(), base: stored };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, String(seconds));
    } catch {
      /* ignore */
    }
  }, [seconds, storageKey]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    // Re-anchor a live interval so its next tick doesn't overwrite the reset.
    if (anchorRef.current) anchorRef.current = { at: Date.now(), base: 0 };
    secondsRef.current = 0;
    setSeconds(0);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "0");
      } catch {
        /* ignore */
      }
    }
  }, [storageKey]);

  return { seconds, running, start, pause, toggle, reset };
}
