import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";

/**
 * The one site-wide top bar: brand + primary nav on the left, an auth/account
 * slot on the right. Used on the homepage, the app pages and the static pages
 * so the header is identical everywhere.
 */
export function TopNav({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-6 border-b border-hairline bg-canvas/95 px-5 backdrop-blur-sm sm:px-8">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center text-fg">
          <span className="text-[15px] font-medium tracking-[-0.01em]">
            IITM BS Community
          </span>
        </Link>
        <MarketingNav />
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
