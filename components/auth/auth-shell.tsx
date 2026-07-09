import Link from "next/link";
import { Logo } from "@/components/icons";

/** Minimal, single-column frame for the auth screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={22} className="text-fg" />
          <span className="text-[15px] font-medium tracking-[-0.01em]">
            OPPE Practice
          </span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[400px] flex-col px-5 pb-16 pt-10 sm:pt-16">
        <h1 className="text-[24px] font-medium tracking-[-0.01em]">{title}</h1>
        <p className="mt-1.5 text-[14px] text-fg-muted">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-[13px] text-fg-muted">{footer}</p>
      </main>
    </div>
  );
}
