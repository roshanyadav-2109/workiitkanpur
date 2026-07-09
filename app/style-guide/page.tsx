import type { Metadata } from "next";
import { StyleGuide } from "@/components/style-guide";

export const metadata: Metadata = { title: "Style guide" };

export default function StyleGuidePage() {
  return <StyleGuide />;
}
