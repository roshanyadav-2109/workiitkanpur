import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

const FOOTER_LINKS = [
  { href: "/practice", label: "Practice" },
  { href: "/pyqs", label: "PYQs" },
  { href: "/test-series", label: "Test Series" },
  { href: "/app/subjects", label: "Subjects" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/login", label: "Sign in" },
  { href: "/contact", label: "Contact" },
];

/** Site-wide crawlable navigation plus the independence notice. */
export function SiteFooter() {
  return (
    <footer className="bg-accent text-white">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-6 sm:w-[85%] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-[13px] font-semibold">{SITE_NAME}</span>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-white/80"
          >
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-5 border-t border-white/20 pt-4 text-[11px] leading-5 text-white/70">
          Independent website by the IITM BS Student Community. Not affiliated
          with, endorsed by or an official product of IIT Madras.
        </p>
      </div>
    </footer>
  );
}
