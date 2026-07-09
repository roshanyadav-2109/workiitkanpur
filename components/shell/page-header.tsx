import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[24px] font-medium tracking-[-0.01em]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-[64ch] text-[14px] leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Hairline-separated grid of stats. */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCell({ children }: { children: React.ReactNode }) {
  return <div className="bg-canvas p-5">{children}</div>;
}
