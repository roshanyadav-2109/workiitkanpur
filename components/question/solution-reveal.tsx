"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { IconChevron } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Solutions stay hidden until the student chooses to reveal them. */
export function SolutionReveal({ solution }: { solution: string | null }) {
  const [open, setOpen] = useState(false);
  if (!solution) return null;

  return (
    <section className="rounded-md border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[14px] font-medium">Solution</span>
        <span className="flex items-center gap-2 text-[13px] text-fg-muted">
          {open ? "Hide" : "Reveal"}
          <IconChevron
            size={16}
            className={cn("transition-transform", open && "rotate-90")}
          />
        </span>
      </button>
      {open && (
        <div className="border-t border-hairline px-4 py-4">
          <Markdown>{solution}</Markdown>
        </div>
      )}
    </section>
  );
}
