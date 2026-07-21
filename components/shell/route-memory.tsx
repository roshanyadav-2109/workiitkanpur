"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberRoute } from "@/lib/last-route";

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
    rememberRoute(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, search]);

  return null;
}
