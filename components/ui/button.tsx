import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonVariantProps {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "whitespace-nowrap select-none transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Primary carries the accent — the single most prominent, uniform use of colour.
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "border border-hairline-strong text-fg bg-transparent hover:bg-surface active:bg-surface",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface",
  danger:
    "border border-hairline-strong text-fg bg-transparent hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-[14px]",
  lg: "h-11 px-5 text-[15px]",
};

/** Returns the class string for a button-styled element (use on <Link> too). */
export function buttonVariants({
  variant = "secondary",
  size = "md",
}: ButtonVariantProps = {}): string {
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
