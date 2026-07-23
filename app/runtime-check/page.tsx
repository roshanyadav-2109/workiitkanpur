import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RuntimeCheckHarness } from "./harness";

export const metadata: Metadata = { title: "Runtime check" };

/**
 * Development-only check that the in-browser Python and Postgres runtimes work
 * together. It is not linked from anywhere and 404s outside development, so it
 * never reaches a student — but it stays in the repo, because the runtime's
 * moving parts (a module worker, Pyodide, PGlite and the wire bridge between
 * them) can only really be verified in a browser.
 */
export default function RuntimeCheckPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <RuntimeCheckHarness />;
}
