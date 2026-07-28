import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to IITM BS Community to practise for the IIT Madras BS Degree OPPE — save your progress, download solutions and join the leaderboard.",
  path: "/login",
});

const ERROR_MESSAGES: Record<string, string> = {
  domain:
    "Only IIT Madras emails can sign in. Please use your iitm.ac.in email.",
  google: "Sign-in was cancelled or failed. Please try again.",
  token: "Sign-in failed. Please try again.",
  session: "Sign-in failed. Please try again.",
  state: "Sign-in session expired. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/app/subjects";
  const initialError = error ? (ERROR_MESSAGES[error] ?? null) : null;

  return (
    <AuthShell>
      <AuthForm next={target} initialError={initialError} />
    </AuthShell>
  );
}
