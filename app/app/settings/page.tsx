import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getUserAttempts,
  getQuestionCount,
  getLeaderboard,
} from "@/lib/queries";
import { computeProgress } from "@/lib/metrics";
import { pluralize } from "@/lib/utils";
import { DisplayNameForm } from "@/components/settings/display-name-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings" };

function GoogleG({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/settings");

  const [{ data: profile }, attempts, totalQuestions, board] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    getUserAttempts(user.id),
    getQuestionCount(),
    getLeaderboard(100),
  ]);

  const meta = user.user_metadata ?? {};
  const displayName =
    profile?.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Student";
  const avatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null;
  const provider = (user.app_metadata?.provider as string | undefined) ?? "email";
  const isGoogle = provider === "google";

  const summary = computeProgress(attempts, totalQuestions);
  const rankIdx = board.findIndex((r) => r.user_id === user.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  const stats = [
    { label: "Questions solved", value: `${summary.solvedCount}` },
    {
      label: "Current streak",
      value: `${summary.streaks.current} ${pluralize(summary.streaks.current, "day", "days")}`,
    },
    { label: "Global rank", value: rank ? `#${rank}` : "—" },
  ];

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <h1
        className="text-[30px] font-semibold tracking-[-0.01em] text-fg"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        Settings
      </h1>
      <p className="mt-1 text-[14px] text-fg-muted">
        Your profile and account, in one place.
      </p>

      {/* Identity card — the signature element */}
      <div className="mt-6 overflow-hidden rounded-[14px] border border-hairline bg-canvas">
        {/* violet band with a soft concentric-ring motif */}
        <div className="relative h-28 bg-gradient-to-br from-[#6d5ce2] to-[#4a39b8]">
          <div
            aria-hidden
            className="absolute -right-8 -top-10 h-48 w-48 rounded-full border border-white/15"
          />
          <div
            aria-hidden
            className="absolute right-6 top-6 h-28 w-28 rounded-full border border-white/10"
          />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* avatar, overlapping the band */}
            <div className="-mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-[#8b7bf0] to-[#5a48d6] text-white ring-4 ring-canvas">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[36px] font-semibold">{initial}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  className="text-[24px] font-semibold leading-tight tracking-[-0.01em] text-fg"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {displayName}
                </h2>
                {isGoogle && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface px-2.5 py-1 text-[12px] font-medium text-fg">
                    <GoogleG /> Google
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[13.5px] text-fg-muted">
                {user.email}
              </p>
            </div>
          </div>

          {/* real product stats — grounds this in the exam-prep world */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-[19px] font-semibold tracking-[-0.01em] text-fg sm:text-[22px]">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[12px] text-fg-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Name + account */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-[14px] border border-hairline bg-canvas p-5">
          <h3 className="text-[15px] font-semibold text-fg">Your name</h3>
          <p className="mt-1 text-[13px] text-fg-muted">
            This is the name shown on the leaderboard and across the app.
          </p>
          <div className="mt-4">
            <DisplayNameForm initial={displayName} />
          </div>
        </section>

        <section className="flex flex-col rounded-[14px] border border-hairline bg-canvas p-5">
          <h3 className="text-[15px] font-semibold text-fg">Account</h3>
          <p className="mt-1 text-[13px] text-fg-muted">
            How you sign in. Your photo and email come from{" "}
            {isGoogle ? "your Google account" : "your account"}.
          </p>

          <dl className="mt-4 space-y-3 text-[13.5px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">Email</dt>
              <dd className="truncate font-medium text-fg">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">Sign-in method</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium text-fg">
                {isGoogle ? (
                  <>
                    <GoogleG size={14} /> Google
                  </>
                ) : (
                  "Email"
                )}
              </dd>
            </div>
          </dl>

          <form action="/auth/signout" method="post" className="mt-auto pt-5">
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
