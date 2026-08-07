import type { Metadata } from "next";
import { AppIndexRedirect } from "@/components/shell/app-index-redirect";

export const metadata: Metadata = {
  title: "Resume practice",
  robots: { index: false, follow: false },
};

export default function AppIndex() {
  return <AppIndexRedirect />;
}
