"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { lastRoute } from "@/lib/last-route";

/**
 * The old /app dashboard is removed. Entering the app now resumes wherever the
 * learner was — the question they had open, the subject they were working
 * through — and falls back to the progress dashboard on a first visit.
 *
 * Client-side because the remembered route lives in localStorage, which a
 * server redirect cannot see.
 */
export default function AppIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace(lastRoute() ?? "/app/progress");
  }, [router]);

  return (
    <div className="grid min-h-[40vh] place-items-center">
      <p className="text-[13px] text-fg-muted">Taking you back where you were…</p>
    </div>
  );
}
