"use client";

import dynamic from "next/dynamic";
import { PythonRuntime } from "@/components/execution/python-runtime";
import { McqRuntime } from "@/components/execution/mcq-runtime";
import { UnavailableRuntime } from "@/components/execution/unavailable-runtime";
import type { RuntimeProps } from "@/components/execution/types";

// SQL pulls in the Postgres WASM (PGlite), so load it only when needed.
const SqlRuntime = dynamic(
  () => import("@/components/execution/sql-runtime").then((m) => m.SqlRuntime),
  {
    ssr: false,
    loading: () => (
      <p className="text-[13px] text-fg-muted">Loading SQL runtime…</p>
    ),
  },
);

const RUNTIME_LABEL: Record<string, string> = {
  coding: "Python",
  sql: "SQL",
  mcq: "Multiple choice",
  shell: "Shell",
  java: "Java",
  c: "C",
};

/**
 * Phase 2 execution seam (realised). Dispatches to the runtime for the
 * question's `kind`. Adding a new language = add one runtime file + a branch
 * here; the RuntimeProps contract keeps the rest of the page unchanged.
 */
export function RuntimeArea(props: RuntimeProps) {
  const kind = props.question.kind;

  let body: React.ReactNode;
  if (kind === "coding") body = <PythonRuntime {...props} />;
  else if (kind === "mcq") body = <McqRuntime {...props} />;
  else if (kind === "sql") body = <SqlRuntime {...props} />;
  else body = <UnavailableRuntime kind={kind} />;

  return (
    <section className="rounded-md border border-hairline">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="text-[13px] font-medium">
          {kind === "mcq" ? "Answer" : "Code runner"}
        </span>
        <span className="text-[11px] uppercase tracking-[0.04em] text-fg-faint">
          {RUNTIME_LABEL[kind] ?? kind} · runs in your browser
        </span>
      </div>
      <div className="p-3">{body}</div>
    </section>
  );
}
