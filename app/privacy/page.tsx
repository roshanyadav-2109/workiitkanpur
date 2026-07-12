import type { Metadata } from "next";
import { PageFrame } from "@/components/marketing/page-frame";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PageFrame title="Privacy">
      <p>
        OPPE Practice is an independent practice tool and is not affiliated with
        IIT Madras. This page explains what we store and why.
      </p>
      <h2>What we store</h2>
      <p>
        When you sign in we keep your account email and your practice activity —
        the questions you attempt, your submissions, best times and notes — so we
        can show your progress and leaderboards.
      </p>
      <h2>Where code runs</h2>
      <p>
        Your Python and SQL run entirely in your own browser. Your code is not
        sent to a server to execute.
      </p>
      <h2>What we don&apos;t do</h2>
      <p>
        We don&apos;t sell your data or share it with advertisers. You can ask us
        to delete your account and activity at any time.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:officeneuralai@gmail.com">officeneuralai@gmail.com</a>.
      </p>
    </PageFrame>
  );
}
