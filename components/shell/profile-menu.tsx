"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";

interface Me {
  name: string;
  email: string;
  photo: string | null;
}

/** Open-door glyph for the sign-out row. */
function IconDoorOpen({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* frame */}
      <path
        d="M14.5 5.5H18a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* swung-open panel */}
      <path
        d="M13.4 3.2 5.8 5a1 1 0 0 0-.8 1v12a1 1 0 0 0 .8 1l7.6 1.8a1 1 0 0 0 1.2-1V4.2a1 1 0 0 0-1.2-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* handle */}
      <circle cx="11.4" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function Avatar({ photo, name }: { photo: string | null; name: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] text-[13px] font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * The signed-in profile control: the Google photo, opening a menu with the
 * dashboard, profile and sign-out. Signed-out visitors get sign in / sign up.
 */
export function ProfileMenu() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        const m = u.user_metadata ?? {};
        setMe({
          name: m.full_name || m.name || u.email?.split("@")[0] || "Account",
          email: u.email ?? "",
          photo: m.avatar_url ?? m.picture ?? null,
        });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Hold the space while we resolve the session so the header doesn't flicker.
  if (loading) return <span className="block h-8 w-8" aria-hidden />;

  if (!me) {
    return (
      <div className="flex items-center gap-2">
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
      </div>
    );
  }

  const itemCls =
    "flex h-10 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[14px] font-normal text-fg hover:bg-surface";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="block rounded-full ring-offset-2 transition-opacity hover:opacity-90"
      >
        <Avatar photo={me.photo} name={me.name} />
      </button>

      {open && (
        <>
          <button
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[10px] border border-[#3d3d3d] bg-canvas"
          >
            <div className="border-b border-hairline px-3.5 py-3">
              <p className="truncate text-[14px] font-medium text-fg">{me.name}</p>
              <p className="truncate text-[12px] text-fg-muted">{me.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/app/progress"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemCls}
              >
                Progress dashboard
              </Link>
              <Link
                href="/app/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemCls}
              >
                My profile
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex h-10 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[14px] font-normal text-err hover:bg-err-weak"
                >
                  {/* icon stays black; only the label carries the red */}
                  <span className="text-fg">
                    <IconDoorOpen size={16} />
                  </span>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
