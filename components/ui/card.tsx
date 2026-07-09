import * as React from "react";
import { cn } from "@/lib/utils";

/** Depth comes from a single hairline border — never a shadow. */
export function Card({
  className,
  surface = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { surface?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-hairline",
        surface ? "bg-surface" : "bg-canvas",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3.5 border-b border-hairline",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[14px] font-medium text-fg", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
