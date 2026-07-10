"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { AccountMenu } from "@/components/shell/account-menu";
import { IconMenu, IconClose, Logo } from "@/components/icons";

export function AppShell({
  email,
  displayName,
  children,
}: {
  email: string | null;
  displayName: string | null;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Question practice and a subject's question list are focused, full-width
  // views — no sidebar. ("/app/subjects/" matches a subject, not the list.)
  const focused =
    pathname.startsWith("/app/questions/") ||
    pathname.startsWith("/app/subjects/");

  if (focused) {
    return (
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-canvas/95 px-4 backdrop-blur-sm sm:px-6">
          <Link
            href="/app/subjects"
            className="flex items-center gap-2.5 text-fg"
          >
            <Logo size={22} />
            <span className="text-[15px] font-medium tracking-[-0.01em]">
              OPPE Practice
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <AccountMenu email={email} displayName={displayName} />
          </div>
        </header>

        <main className="w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Fixed left sidebar (desktop). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-hairline bg-canvas lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer. */}
      {drawerOpen && (
        <div className="lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-[var(--overlay)]"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-hairline bg-canvas">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar. */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-canvas/95 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface hover:text-fg lg:hidden"
          >
            {drawerOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <AccountMenu email={email} displayName={displayName} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
