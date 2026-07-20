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

  // Browsing stays open, but practising needs a number on file — signed-out
  // visitors are sent to sign in first rather than waved through.
  let hasPhone = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();
    hasPhone = !!profile?.phone;
  }

  return (
    <PhoneGateProvider signedIn={!!user} hasPhone={hasPhone}>
      <AppShell>{children}</AppShell>
    </PhoneGateProvider>
  );
}
