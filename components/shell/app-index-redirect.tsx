"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { lastRoute } from "@/lib/last-route";

/** Resume the learner's last workspace route from browser storage. */
export function AppIndexRedirect() {
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
