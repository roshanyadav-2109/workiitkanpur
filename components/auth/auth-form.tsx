"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Multi-colour Google "G". */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
  const showDemo = mode === "login" && !!demoEmail && !!demoPassword;

  async function onGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  async function onDemo() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail!,
        password: demoPassword!,
      });
      if (error) throw error;
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not open the demo account. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google — primary. Light grey so it reads on the white page. */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-hairline-strong bg-[#f3f3f6] text-[14.5px] font-medium text-fg transition-colors hover:bg-[#eceaf1] disabled:opacity-50"
      >
        <GoogleG />
        Continue with Google
      </button>

      {/* agreement line — purple links */}
      <p className="text-center text-[12.5px] leading-relaxed text-fg-muted">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="font-medium text-accent hover:underline">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      {error && (
        <div className="rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[13px] text-fg">
          {error}
        </div>
      )}

      {showDemo && (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-[12px] text-fg-faint">or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onDemo}
            disabled={loading}
          >
            Explore the demo account
          </Button>
        </>
      )}
    </div>
  );
}
