"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconDashboard,
  IconSubjects,
  IconProgress,
  IconSettings,
  IconTimer,
  Logo,
  type IconProps,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    Icon: IconDashboard,
    match: (p) => p === "/app",
  },
  {
    href: "/app/subjects",
    label: "Subjects",
    Icon: IconSubjects,
    match: (p) => p.startsWith("/app/subjects") || p.startsWith("/app/questions"),
  },
  {
    href: "/app/exam",
    label: "Mock exam",
    Icon: IconTimer,
    match: (p) => p.startsWith("/app/exam"),
  },
  {
    href: "/app/progress",
    label: "Progress",
    Icon: IconProgress,
    match: (p) => p.startsWith("/app/progress"),
  },
  {
    href: "/app/settings",
    label: "Settings",
    Icon: IconSettings,
    match: (p) => p.startsWith("/app/settings"),
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Logo size={22} className="text-fg" />
        <span className="text-[15px] font-medium tracking-[-0.01em]">
          OPPE Practice
        </span>
      </div>

      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 h-9 text-[14px] transition-colors",
                    active
                      ? "bg-accent-weak text-accent font-medium"
                      : "text-fg-muted hover:text-fg hover:bg-surface",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5 py-4">
        <p className="text-[11px] leading-relaxed text-fg-faint">
          IIT Madras BS Degree
          <br />
          OPPE practice
        </p>
      </div>
    </div>
  );
}
