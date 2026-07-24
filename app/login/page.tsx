import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to IITM BS Community to practise for the IIT Madras BS Degree OPPE — save your progress, download solutions and join the leaderboard.",
  path: "/login",
});

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
      <AuthForm next={target} />
    </AuthShell>
  );
}
