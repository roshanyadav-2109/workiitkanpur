"use client";

import type { QuestionKind } from "@/lib/types";

const RUNTIME_LABEL: Record<string, string> = {
  shell: "a browser Linux sandbox (System Commands)",
  java: "a Java judge (CheerpJ / remote judge)",
  c: "a C judge (remote judge)",
};

/**
 * Honest placeholder for kinds whose runtimes require heavy external infra not
 * bundled in this build. The RuntimeProps contract is identical, so wiring the
 * real runtime later is a drop-in — nothing else on the page changes.
 */
export function UnavailableRuntime({ kind }: { kind: QuestionKind }) {
  const label = RUNTIME_LABEL[kind] ?? "this runtime";
  return (
    <div className="rounded-md border border-hairline bg-surface px-4 py-6">
      <p className="text-[14px] font-medium">Runtime not bundled</p>
      <p className="mt-1.5 max-w-[56ch] text-[13px] leading-relaxed text-fg-muted">
        Running this question needs {label}, which is planned but not included in
        this build. The execution seam is in place — when the runtime ships it
        mounts here with no other changes.
      </p>
    </div>
  );
}
