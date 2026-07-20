import { TopNav } from "@/components/shell/top-nav";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { SiteFooter } from "@/components/marketing/site-footer";

/** Simple centered frame for the static marketing pages (contact/privacy…). */
export function PageFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav right={<ProfileMenu />} />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-3 py-12 sm:px-6 sm:py-16">
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        <div className="prose-oppe mt-6">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
