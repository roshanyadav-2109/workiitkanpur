import type { Metadata } from "next";
import { PageFrame } from "@/components/marketing/page-frame";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <PageFrame title="Contact us">
      <p>
        Have a question, spotted a bug, or want a subject or exam added? We read
        every message.
      </p>
      <p>
        Email us at{" "}
        <a href="mailto:iitmbsdegreestudent@gmail.com">iitmbsdegreestudent@gmail.com</a> and
        we&apos;ll get back to you.
      </p>
      <p>
        Please include the subject, question and what you expected to happen — it
        helps us fix things faster.
      </p>
    </PageFrame>
  );
}
