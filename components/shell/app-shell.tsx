"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/shell/account-menu";
import { TopNav } from "@/components/shell/top-nav";

export function AppShell({
  email,
  displayName,
  children,
}: {
  email: string | null;
  displayName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The question IDE / test runner fill the viewport with their own scrolling.
  const ide =
    pathname.startsWith("/app/questions/") ||
    (pathname.startsWith("/app/test/") && pathname.endsWith("/run"));
  const progress = pathname.startsWith("/app/progress");
  const wide = pathname.startsWith("/app/subjects") || progress;

  // One consistent top bar everywhere — no sidebar.
  const mainClass = ide
    ? "min-h-0 flex-1"
    : progress
      ? "w-full flex-1 px-4 py-6 sm:px-6 lg:py-8"
      : wide
        ? "mx-auto w-full max-w-[90%] flex-1 px-4 py-6 sm:px-6 lg:py-8"
        : "mx-auto w-full max-w-[1080px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10";

  return (
    <div className={cn("flex flex-col", ide ? "h-dvh" : "min-h-dvh")}>
      <TopNav right={<AccountMenu email={email} displayName={displayName} />} />
      <main className={mainClass}>{children}</main>
    </div>
  );
}
