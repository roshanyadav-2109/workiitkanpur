"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Flat list of everything reachable from the desktop nav, for the mobile drawer. */
const SECTIONS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Practice",
    items: [
      { label: "All subjects", href: "/app/subjects" },
      { label: "Programming in Python", href: "/app/subjects/python" },
      { label: "Database Management", href: "/app/subjects/dbms" },
      { label: "PYQ · OPPE 1", href: "/app/subjects/python?exam=OPPE%201" },
      { label: "PYQ · OPPE 2", href: "/app/subjects/python?exam=OPPE%202" },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Home", href: "/" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Contact us", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-[8px] text-fg"
      >
        {/* single chevron that flips open/closed */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={"transition-transform " + (open ? "rotate-180" : "")}
        >
          <path
            d="M6 9 L12 15 L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* invisible click-catcher to close on outside tap — no dimming colour */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-40 bg-transparent"
          />
          {/* dropdown panel, dropped straight below the bar */}
          <div className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-auto border-b-2 border-b-[#3d3d3d] bg-canvas px-4 py-4">
            {SECTIONS.map((s) => (
              <div key={s.title} className="mb-4 last:mb-0">
                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg">
                  {s.title}
                </div>
                <ul>
                  {s.items.map((it) => {
                    const active =
                      it.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(it.href.split("?")[0]);
                    return (
                      <li key={it.label}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={
                            "block rounded-[7px] px-2 py-2.5 text-[15px] text-fg " +
                            (active ? "font-semibold" : "font-normal")
                          }
                        >
                          {it.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
