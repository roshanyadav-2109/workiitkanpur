import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { DisplayNameForm } from "@/components/settings/display-name-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings" };

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-hairline py-6 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div>
        <h2 className="text-[14px] font-medium">{title}</h2>
        <p className="mt-1 max-w-[44ch] text-[13px] text-fg-muted">
          {description}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile and appearance."
      />

      <div className="max-w-3xl">
        <SettingsRow
          title="Profile"
          description="The name shown across the app."
        >
          <DisplayNameForm initial={displayName} />
        </SettingsRow>

        <SettingsRow title="Email" description="Used to sign in.">
          <p className="text-[14px] tnum text-fg">{user.email}</p>
        </SettingsRow>

        <SettingsRow
          title="Sign out"
          description="End your session on this device."
        >
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </SettingsRow>
      </div>
    </>
  );
}
