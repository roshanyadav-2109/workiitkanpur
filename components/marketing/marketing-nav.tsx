"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevron } from "@/components/icons";

// Each main filter with its sub-filters listed underneath.
const MENU: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Subjects",
    items: [
      { label: "Programming in Python", href: "/app/subjects/python" },
      { label: "Database Management", href: "/app/subjects/dbms" },
      { label: "Data Structures & Algorithms", href: "/app/subjects" },
      { label: "Programming in Java", href: "/app/subjects" },
      { label: "Programming in C", href: "/app/subjects" },
      { label: "System Commands", href: "/app/subjects" },
    ],
  },
  {
    title: "Branch",
    items: [
      { label: "Data Science & Applications", href: "/app/subjects" },
      { label: "Electronic Systems", href: "/app/subjects" },
    ],
  },
  {
    title: "Exam level",
    items: [
      { label: "Foundation", href: "/app/subjects" },
      { label: "Diploma", href: "/app/subjects" },
      { label: "Degree", href: "/app/subjects" },
    ],
  },
  {
    title: "PYQ",
    items: [
      { label: "OPPE 1", href: "/app/subjects/python?exam=OPPE%201" },
      { label: "OPPE 2", href: "/app/subjects/python?exam=OPPE%202" },
    ],
  },
  {
    title: "Timed mock",
    items: [
      { label: "Test series", href: "/app/subjects" },
      { label: "Full mock exams", href: "/app/subjects" },
    ],
  },
];

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contact", label: "Contact us" },
  { href: "/privacy", label: "Privacy" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const practiceActive =
    pathname.startsWith("/app/subjects") || pathname.startsWith("/app/test");

  return (
    <nav className="hidden items-center gap-8 text-[15.5px] text-fg md:flex">
      <Link href="/" className={isActive("/") ? "font-bold" : "font-normal"}>
        Home
      </Link>

      {/* Practice — hover mega-menu that drops below the whole navbar. The group
          spans the full header height so there's no hover gap between the button
          and the panel (which would otherwise close it mid-move). */}
      <div className="group flex h-14 items-center">
        <button
          type="button"
          className={
            "flex items-center gap-1.5 " +
            (practiceActive ? "font-bold" : "font-normal")
          }
        >
          Practice
          <IconChevron
            size={13}
            className="rotate-90 text-fg-muted transition-transform group-hover:rotate-[270deg]"
          />
        </button>

        {/* Full-width panel anchored to the header (position: relative on it). */}
        <div className="absolute left-0 right-0 top-full z-50 hidden group-hover:block">
          <div className="border-t border-t-hairline border-b-2 border-b-[#3d3d3d] bg-canvas">
            <div className="mx-auto grid w-[90%] max-w-[1150px] grid-cols-2 gap-x-8 gap-y-7 px-2 py-7 sm:grid-cols-3 lg:grid-cols-5">
              {MENU.map((col) => (
                <div key={col.title}>
                  <div className="flex items-center gap-1.5 text-[14.5px] font-bold text-fg">
                    <span className="text-fg-muted">›</span>
                    {col.title}
                  </div>
                  <ul className="mt-2.5 space-y-1.5 pl-4">
                    {col.items.map((it) => (
                      <li key={it.label}>
                        <Link
                          href={it.href}
                          className="flex items-center gap-1.5 text-[13.5px] text-fg-muted transition-colors hover:text-fg"
                        >
                          <span className="text-fg-faint">›</span>
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {LINKS.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className={isActive(it.href) ? "font-bold" : "font-normal"}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
