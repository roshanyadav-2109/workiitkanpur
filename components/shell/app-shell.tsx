"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { TopNav } from "@/components/shell/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The question IDE / test runner fill the viewport with their own scrolling.
  const ide =
    pathname.startsWith("/app/questions/") ||
    (pathname.startsWith("/app/test/") && pathname.endsWith("/run"));
  const progress = pathname.startsWith("/app/progress");
  const wide = pathname.startsWith("/app/subjects") || progress;

  // One consistent top bar everywhere — no sidebar.
  // Uniform, tight edge gutter on mobile (px-3) everywhere; wider layouts only
  // introduce their max-width / extra breathing room from lg up.
  const mainClass = ide
    ? "min-h-0 flex-1"
    : progress
      ? "w-full flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:py-8"
      : wide
        ? "w-full flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:mx-auto lg:max-w-[90%] lg:py-8"
        : "w-full flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:mx-auto lg:max-w-[1080px] lg:px-10 lg:py-10";

  return (
    <div className={cn("flex flex-col", ide ? "h-dvh" : "min-h-dvh")}>
      <TopNav right={<ProfileMenu />} />
      <main className={mainClass}>{children}</main>
    </div>
  );
}
