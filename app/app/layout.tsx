import { getCurrentUser, getProfilePhone } from "@/lib/queries";
import { AppShell } from "@/components/shell/app-shell";
import { PhoneGateProvider } from "@/components/phone/phone-gate";
import { RouteMemory } from "@/components/shell/route-memory";
import { Suspense } from "react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Both cached per request, so the page rendering underneath this layout
  // reuses the same auth round-trip instead of making its own.
  const user = await getCurrentUser();

  // Browsing stays open, but practising needs a number on file — signed-out
  // visitors are sent to sign in first rather than waved through.
  const hasPhone = user ? !!(await getProfilePhone(user.id)) : false;

  return (
    <PhoneGateProvider signedIn={!!user} hasPhone={hasPhone}>
      {/* useSearchParams needs a Suspense boundary during prerender */}
      <Suspense fallback={null}>
        <RouteMemory />
      </Suspense>
      <AppShell>{children}</AppShell>
    </PhoneGateProvider>
  );
}
