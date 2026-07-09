"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wall-clock stopwatch. Anchors to a timestamp on each run so elapsed time
 * stays accurate even when the tab is backgrounded and setInterval throttles.
 * The anchor lives in a ref that `reset()` also updates, so resetting while the
 * timer is running is not clobbered by the interval's next tick.
 */
export function useStopwatch(initialSeconds = 0, autoStart = true) {
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
    anchorRef.current = { at: Date.now(), base: secondsRef.current };
    const tick = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      setSeconds(anchor.base + Math.floor((Date.now() - anchor.at) / 1000));
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    // Re-anchor a live interval so its next tick doesn't overwrite the reset.
    if (anchorRef.current) anchorRef.current = { at: Date.now(), base: 0 };
    setSeconds(0);
  }, []);

  return { seconds, running, start, pause, toggle, reset };
}
