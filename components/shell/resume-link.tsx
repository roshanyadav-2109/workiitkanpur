"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lastRoute } from "@/lib/last-route";

/**
 * "Pick up where you left off" on the landing page.
 *
 * Arriving at the site in a fresh tab means typing the domain, which lands
 * here rather than back in the app. Rather than redirect signed-in visitors
 * away from the landing page (which would break the Home link), this offers the
 * way back and stays out of the way when there is nowhere to go.
 *
 * Rendered after mount: the route lives in localStorage, so the server has no
 * idea whether it exists and rendering it directly would mismatch on hydration.
 */
export function ResumeLink() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    setHref(lastRoute());
  }, []);

  if (!href) return null;

  return (
    <div className="mt-6">
      <Link
        href={href}
        className="inline-flex h-11 items-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-6 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:from-[#7a6ae8] hover:to-[#6455dd]"
      >
        Pick up where you left off →
      </Link>
    </div>
  );
}
