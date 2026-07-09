"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconAccount } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

export function AccountMenu({
  email,
  displayName,
}: {
  email: string | null;
  displayName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  if (!email) {
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

  const name = displayName || email.split("@")[0];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md pl-1.5 pr-2.5 text-[14px]",
          "text-fg-muted hover:text-fg hover:bg-surface transition-colors",
        )}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-hairline-strong text-fg">
          <IconAccount size={15} />
        </span>
        <span className="hidden max-w-[12ch] truncate sm:inline">{name}</span>
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
            className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-md border border-hairline bg-canvas shadow-[var(--shadow-overlay)]"
          >
            <div className="border-b border-hairline px-3.5 py-3">
              <p className="truncate text-[14px] font-medium text-fg">{name}</p>
              <p className="truncate text-[12px] text-fg-muted">{email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/app/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex h-9 items-center rounded-md px-2.5 text-[14px] text-fg-muted hover:bg-surface hover:text-fg"
              >
                Settings
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex h-9 w-full items-center rounded-md px-2.5 text-left text-[14px] text-fg-muted hover:bg-surface hover:text-fg"
                >
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
