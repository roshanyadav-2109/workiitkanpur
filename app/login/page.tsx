import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/app/subjects";

  return (
    <AuthShell
      footer={
        <>
          New here? Continuing with Google creates your account automatically —
          no separate sign-up needed.
        </>
      }
    >
      <AuthForm mode="login" next={target} />
    </AuthShell>
  );
}
