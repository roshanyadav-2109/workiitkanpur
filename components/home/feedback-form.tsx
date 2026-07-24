"use client";

import { useState, type FormEvent } from "react";
import { submitFeedback } from "@/lib/feedback-actions";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FeedbackDefaults {
  name: string;
  email: string;
  phone: string;
}

/**
 * Homepage feedback form. Login is not required; when the visitor is signed in,
 * their name / email / phone arrive pre-filled and can still be edited.
 */
export function FeedbackForm({ defaults }: { defaults: FeedbackDefaults }) {
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Please write your feedback before sending.");
      return;
    }
    setSending(true);
    const res = await submitFeedback({ name, email, phone, message });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setMessage("");
    } else {
      setError(res.error);
    }
  }

  if (done) {
    return (
      <div className="rounded-[8px] border border-ok/40 bg-ok-weak p-6 text-center">
        <p className="text-[15px] font-medium text-fg">
          Thanks — your feedback is in.
        </p>
        <p className="mt-1 text-[13.5px] text-fg-muted">We read every message.</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-3 text-[13px] font-medium text-accent hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" htmlFor="fb-name">
          <Input
            id="fb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>
        <Field label="Email" htmlFor="fb-email">
          <Input
            id="fb-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" htmlFor="fb-phone">
          <Input
            id="fb-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
            autoComplete="tel"
          />
        </Field>
      </div>
      <Field label="Feedback" htmlFor="fb-message" error={error ?? undefined}>
        <Textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's working, what's missing, or a subject you'd like added…"
          rows={4}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="md" disabled={sending}>
          {sending ? "Sending…" : "Send feedback"}
        </Button>
        <span className="text-[12.5px] text-fg-muted">No account needed.</span>
      </div>
    </form>
  );
}
