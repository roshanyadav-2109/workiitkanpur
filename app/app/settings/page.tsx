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
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Settings" };

function GoogleG({ size = 14 }: { size?: number }) {
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
    supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    getUserAttempts(user.id),
    getQuestionCount(),
    getLeaderboard(100),
  ]);

  const meta = user.user_metadata ?? {};
  const displayName =
    profile?.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Student";
  const phone: string = profile?.phone ?? "";
  const avatarUrl: string | null = meta.avatar_url ?? meta.picture ?? null;
  const isGoogle = (user.app_metadata?.provider as string | undefined) === "google";

  const summary = computeProgress(attempts, totalQuestions);
  const rankIdx = board.findIndex((r) => r.user_id === user.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const stats = [
    { label: "Questions solved", value: `${summary.solvedCount}` },
    {
      label: "Current streak",
      value: `${summary.streaks.current} ${pluralize(summary.streaks.current, "day", "days")}`,
    },
    { label: "Global rank", value: rank ? `#${rank}` : "—" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* LEFT — profile image + vertical stats */}
        <aside className="space-y-6">
          {/* profile image — no card, no purple header */}
          <div className="flex flex-col items-center text-center">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-[#8b7bf0] to-[#5a48d6] text-white ring-1 ring-hairline-strong">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[42px] font-semibold">{initial}</span>
              )}
            </div>
            <div
              className="mt-3.5 text-[18px] font-semibold text-fg"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {displayName}
            </div>
            {isGoogle && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface px-2.5 py-1 text-[12px] font-medium text-fg">
                <GoogleG /> Google
              </span>
            )}
          </div>

          {/* vertical stats column */}
          <section className="rounded-[14px] border border-hairline bg-canvas p-5">
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg">
              Your activity
            </div>
            <dl className="mt-3 divide-y divide-hairline">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-[13.5px] text-fg">{s.label}</dt>
                  <dd className="text-[16px] font-semibold tracking-[-0.01em] text-fg">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>

        {/* RIGHT — name / email / phone */}
        <section className="rounded-[14px] border border-hairline bg-canvas p-6">
          <h2 className="text-[16px] font-semibold text-fg">Profile details</h2>
          <p className="mt-1 text-[13px] text-fg-muted">
            Your email and phone number are private to you.
          </p>
          <div className="mt-5">
            <ProfileForm
              initialName={displayName}
              email={user.email ?? ""}
              initialPhone={phone}
            />
          </div>

          <form
            action="/auth/signout"
            method="post"
            className="mt-6 border-t border-hairline pt-5"
          >
            <button
              type="submit"
              className="text-[13.5px] font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
