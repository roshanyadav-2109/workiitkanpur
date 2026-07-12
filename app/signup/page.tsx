import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/app") ? next : "/app";

  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" next={target} />
    </AuthShell>
  );
}
