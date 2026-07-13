"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Item {
  label: string;
  href: string;
}
interface Tab {
  label: string;
  href?: string;
  children?: Item[];
}

/** Top-level mobile tabs. A tab with `children` opens its own sub-screen. */
const TABS: Tab[] = [
  { label: "Home", href: "/" },
  {
    label: "Practice",
    children: [
      { label: "All subjects", href: "/app/subjects" },
      { label: "Programming in Python", href: "/app/subjects/python" },
      { label: "Database Management", href: "/app/subjects/dbms" },
      { label: "PYQ · OPPE 1", href: "/app/subjects/python?exam=OPPE%201" },
      { label: "PYQ · OPPE 2", href: "/app/subjects/python?exam=OPPE%202" },
    ],
  },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Contact us", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
];

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6 L15 12 L9 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const rowCls =
  "flex w-full items-center justify-between gap-2 border-b border-[#3d3d3d] px-5 py-4 text-left text-[16px] font-normal text-fg";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; photo: string | null } | null>(
    null,
  );

  // Pull the signed-in user so the footer button can show their photo + name.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return setUser(null);
      const m = u.user_metadata ?? {};
      setUser({
        name: m.full_name || m.name || u.email?.split("@")[0] || "Account",
        photo: m.avatar_url ?? m.picture ?? null,
      });
    });
  }, []);

  // Lock the page behind the drawer while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setSub(null);
  }

  const activeTab = TABS.find((t) => t.label === sub);

  // Violet account / login button — pinned to the bottom of the drawer so it
  // stays put whether you're at the root or inside a tab.
  const accountButton = user ? (
    <Link
      href="/app/progress"
      onClick={close}
      className="flex items-center gap-3 rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3 py-3 text-white ring-1 ring-inset ring-white/20"
    >
      <Avatar photo={user.photo} />
      <span className="min-w-0 flex-1 truncate text-[16px] font-normal">
        {user.name}
      </span>
      <ChevronRight />
    </Link>
  ) : (
    <Link
      href="/login"
      onClick={close}
      className="flex h-12 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[16px] font-semibold text-white ring-1 ring-inset ring-white/20"
    >
      Login
    </Link>
  );

  return (
    <div className="md:hidden">
      {/* Big three-line menu button */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-[8px] text-fg"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3.5 7h17 M3.5 12h17 M3.5 17h17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Full-screen drawer — always mounted so it can slide in/out from the
          right. `translate-x-full` parks it off-screen when closed. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed inset-0 z-[60] flex flex-col bg-canvas transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {/* Header: current screen title + close button */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#3d3d3d] px-5">
          <span className="text-[17px] font-semibold text-fg">
            {activeTab ? activeTab.label : "Menu"}
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-[8px] text-fg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6 L18 18 M18 6 L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body: root tabs or a tab's sub-screen */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeTab ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setSub(null)}
                className="flex w-full items-center gap-2 border-b border-[#3d3d3d] px-5 py-4 text-left text-[15px] font-medium text-fg/70"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 6 L9 12 L15 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
              {activeTab.children!.map((it) => (
                <Link
                  key={it.label}
                  href={it.href}
                  onClick={close}
                  className={rowCls}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {TABS.map((t) =>
                t.children ? (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setSub(t.label)}
                    className={rowCls}
                  >
                    {t.label}
                    <ChevronRight />
                  </button>
                ) : (
                  <Link
                    key={t.label}
                    href={t.href!}
                    onClick={close}
                    className={rowCls}
                  >
                    {t.label}
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        {/* Login / account button — fixed at the bottom of the drawer */}
        <div className="shrink-0 border-t border-[#3d3d3d] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {accountButton}
        </div>
      </div>
    </div>
  );
}

function Avatar({ photo }: { photo: string | null }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/40"
      />
    );
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-white">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8.5" r="3.6" fill="currentColor" />
        <path d="M4.5 20c0-4 3.4-6.4 7.5-6.4s7.5 2.4 7.5 6.4" fill="currentColor" />
      </svg>
    </span>
  );
}
