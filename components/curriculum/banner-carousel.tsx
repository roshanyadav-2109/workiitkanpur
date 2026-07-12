"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/queries";

/**
 * Image-banner carousel. Each slide is a framed image managed from the
 * `carousel_banners` table (image + optional link target). No pagination dots —
 * it auto-advances on its own.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n < 2) return;
    const id = window.setInterval(() => setI((p) => (p + 1) % n), 4600);
    return () => window.clearInterval(id);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className="overflow-hidden rounded-[10px] bg-surface">
      <div
        className="flex transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {banners.map((b) => {
          const frame = (
            <span className="block h-[240px] w-full sm:h-[300px] lg:h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image_url}
                alt={b.alt ?? ""}
                className="h-full w-full object-cover"
              />
            </span>
          );
          return (
            <div key={b.id} className="w-full shrink-0">
              {b.href ? (
                <Link href={b.href} className="block">
                  {frame}
                </Link>
              ) : (
                frame
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
