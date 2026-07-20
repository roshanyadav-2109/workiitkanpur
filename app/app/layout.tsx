import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { PhoneGateProvider } from "@/components/phone/phone-gate";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasPhone = true; // don't gate signed-out visitors
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();
    hasPhone = !!profile?.phone;
  }

  return (
    <PhoneGateProvider hasPhone={hasPhone}>
      <AppShell>{children}</AppShell>
    </PhoneGateProvider>
  );
}
