"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberRoute } from "@/lib/last-route";
import { logEvent } from "@/lib/activity";

/**
 * Records where the learner is, on every navigation inside the app, so a later
 * visit can resume there. Renders nothing.
 *
 * The query string is kept because it carries real state — which exam filter is
 * applied, which tab of a subject is open.
 */
export function RouteMemory() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const qs = search.toString();
    const full = qs ? `${pathname}?${qs}` : pathname;
    rememberRoute(full);
    // Same navigation feeds the activity log; signed-out visits are dropped
    // server side, so nothing is attributed to a stranger.
    void logEvent({ event: "page_view", path: full });
  }, [pathname, search]);

  return null;
}
