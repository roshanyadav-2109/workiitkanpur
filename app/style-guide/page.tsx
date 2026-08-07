import type { Metadata } from "next";
import { StyleGuide } from "@/components/style-guide";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

export default function StyleGuidePage() {
  return <StyleGuide />;
}
