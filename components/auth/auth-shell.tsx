import Link from "next/link";
import { AuthMotion } from "@/components/auth/auth-motion";

/** Two-pane auth frame: an animated brand panel on the left, the form on the
 *  right with a "Welcome" heading set in Fraunces. */
export function AuthShell({
  subtitle,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left — animated brand "launch video", as a padded frame */}
      <div className="hidden p-3.5 lg:flex">
        <AuthMotion />
      </div>

      {/* Right — the form */}
      <div className="relative flex min-h-dvh flex-col bg-canvas">
        <header className="flex h-14 items-center px-6 sm:px-10">
          <Link href="/" className="flex items-center lg:hidden">
            <span className="text-[15px] font-medium tracking-[-0.01em]">
              IITM BS Community
            </span>
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-6 pb-16 text-center sm:px-10">
          <h1
            className="text-[40px] font-semibold leading-none tracking-[-0.01em] text-fg"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Welcome
          </h1>
          {subtitle && (
            <p className="mt-2.5 text-[14px] text-fg-muted">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-[13px] text-fg-muted">{footer}</p>
        </main>
      </div>
    </div>
  );
}
