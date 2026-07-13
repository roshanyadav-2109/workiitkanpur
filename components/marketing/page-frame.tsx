import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TopNav } from "@/components/shell/top-nav";

/** Simple centered frame for the static marketing pages (contact/privacy…). */
export function PageFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav
        right={
          <>
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Sign up
            </Link>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-12 sm:py-16">
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        <div className="prose-oppe mt-6">{children}</div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4 px-5 py-6 text-[12px]">
          <span className="text-fg-muted">IITM BS Community</span>
          <span className="rounded-full bg-accent px-3 py-1 font-medium text-white">
            Independent website by IITM BS Student Community — not affiliated with
            IIT Madras
          </span>
        </div>
      </footer>
    </div>
  );
}
