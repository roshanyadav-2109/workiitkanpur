"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  "flex w-full items-center justify-between gap-2 border-b border-hairline px-3.5 py-3 text-left text-[15px] text-fg last:border-b-0";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; photo: string | null } | null>(
    null,
  );
  const pathname = usePathname();

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

  function close() {
    setOpen(false);
    setSub(null);
  }

  const activeTab = TABS.find((t) => t.label === sub);

  return (
    <div className="md:hidden">
      {/* Big three-line menu button */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
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

      {open && (
        <>
          {/* invisible click-catcher to close on outside tap — no dimming colour */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 top-14 z-40 bg-transparent"
          />
          {/* dropdown panel, dropped straight below the bar */}
          <div className="fixed inset-x-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-auto border-b-2 border-b-[#3d3d3d] bg-canvas px-3 py-3">
            {activeTab ? (
              /* ── Sub-screen: back + the tab's inner options ── */
              <div>
                <button
                  type="button"
                  onClick={() => setSub(null)}
                  className="mb-2 flex items-center gap-1.5 px-1.5 py-1.5 text-[14px] font-semibold text-fg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 6 L9 12 L15 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {activeTab.label}
                </button>
                <div className="overflow-hidden rounded-[3px] border border-hairline">
                  {activeTab.children!.map((it) => {
                    const active = pathname.startsWith(it.href.split("?")[0]);
                    return (
                      <Link
                        key={it.label}
                        href={it.href}
                        onClick={close}
                        className={
                          rowCls + (active ? " font-semibold" : " font-normal")
                        }
                      >
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Root screen: tabs (table-like) + violet login / profile ── */
              <div className="flex flex-col">
                <div className="overflow-hidden rounded-[3px] border border-hairline">
                  {TABS.map((t) =>
                    t.children ? (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setSub(t.label)}
                        className={rowCls + " font-medium"}
                      >
                        {t.label}
                        <ChevronRight />
                      </button>
                    ) : (
                      <Link
                        key={t.label}
                        href={t.href!}
                        onClick={close}
                        className={
                          rowCls +
                          (pathname.startsWith(t.href!.split("?")[0]) &&
                          t.href !== "/"
                            ? " font-semibold"
                            : pathname === t.href
                              ? " font-semibold"
                              : " font-medium")
                        }
                      >
                        {t.label}
                      </Link>
                    ),
                  )}
                </div>

                {/* Violet account / login button — no divider line above it */}
                {user ? (
                  <Link
                    href="/app/settings"
                    onClick={close}
                    className="mt-3 flex items-center gap-3 rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-3 py-2.5 text-white ring-1 ring-inset ring-white/20"
                  >
                    <Avatar photo={user.photo} />
                    <span className="truncate text-[15px] font-semibold">
                      {user.name}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={close}
                    className="mt-3 flex h-11 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[15px] font-semibold text-white ring-1 ring-inset ring-white/20"
                  >
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
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
