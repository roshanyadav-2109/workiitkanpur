import * as React from "react";
import { cn } from "@/lib/utils";
import { IconChevron } from "@/components/icons";

const fieldBase =
  "w-full rounded-md border border-hairline-strong bg-canvas text-fg " +
  "placeholder:text-fg-faint " +
  "transition-colors focus:outline-none focus-visible:border-accent " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, "h-9 px-3 text-[14px]", className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        fieldBase,
        "min-h-24 px-3 py-2 text-[14px] leading-relaxed resize-y",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          fieldBase,
          "h-9 pl-3 pr-9 text-[14px] appearance-none cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {/* Our own chevron overlay — theme-aware, no icon library, no named grey. */}
      <IconChevron
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-fg-muted"
      />
    </div>
  );
});

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + hint/error, in the quiet form language. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-fg"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-fg">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}
