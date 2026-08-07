"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevron } from "@/components/icons";

// The subjects offered, shown under each of the Practice / PYQs / Test Series
// menus. Each menu links into the subject with the matching tab open.
const SUBJECTS: { label: string; slug: string }[] = [
  { label: "Programming in Python", slug: "python" },
  { label: "Database Management Systems", slug: "dbms" },
  { label: "Programming, DS & Algorithms", slug: "pdsa" },
  { label: "Programming in Java", slug: "java" },
  { label: "Programming in C", slug: "c" },
  { label: "System Commands", slug: "syscmd" },
];

// tab is appended to the subject URL so the subject page opens on that section.
function subjectItems(tab?: string) {
  const q = tab ? `?tab=${tab}` : "";
  return SUBJECTS.map((s) => ({
    label: s.label,
    href: `/app/subjects/${s.slug}${q}`,
  }));
}

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contact", label: "Contact us" },
  { href: "/privacy", label: "Privacy" },
];

/** A single hover dropdown: a title button with a subject list beneath it. The
 *  group spans the full header height so there's no hover gap that would close
 *  the panel mid-move. */
function NavMenu({
  title,
  items,
  active,
}: {
  title: string;
  items: { label: string; href: string }[];
  active: boolean;
}) {
  return (
    <div className="group relative flex h-14 items-center">
      <button
        type="button"
        className={
          "flex items-center gap-1.5 " + (active ? "font-bold" : "font-normal")
        }
      >
        {title}
        <IconChevron
          size={13}
          className="rotate-90 text-fg-muted transition-transform group-hover:rotate-[270deg]"
        />
      </button>
      <div className="absolute left-0 top-full z-50 hidden min-w-[248px] pt-0 group-hover:block">
        <div className="overflow-hidden rounded-[3px] border border-hairline border-b-2 border-b-[#3d3d3d] bg-canvas py-1.5">
          <ul>
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13.5px] text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  <span className="text-fg-faint">›</span>
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function MarketingNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const inSubjects = pathname.startsWith("/app/subjects");
  const practiceActive = inSubjects || pathname.startsWith("/app/questions");
  const testActive = pathname.startsWith("/app/test");

  return (
    <nav className="hidden items-center gap-8 text-[15.5px] text-fg md:flex">
      <Link href="/" className={isActive("/") ? "font-bold" : "font-normal"}>
        Home
      </Link>

      <NavMenu title="Practice" items={subjectItems()} active={practiceActive} />
      <NavMenu title="PYQs" items={subjectItems("pyqs")} active={false} />
      <NavMenu
        title="Test Series"
        items={subjectItems("test-series")}
        active={testActive}
      />

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
