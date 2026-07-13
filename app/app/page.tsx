import { redirect } from "next/navigation";

/** The old /app dashboard is removed — send anyone landing here to the
 *  progress dashboard. */
export default function AppIndex() {
  redirect("/app/progress");
}
