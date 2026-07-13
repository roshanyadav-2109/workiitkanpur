"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions";
import { Button } from "@/components/ui/button";

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-fg">{label}</div>
      <div className="mt-1 text-[14px] text-fg">
        {value || <span className="text-fg-muted">Not added yet</span>}
      </div>
    </div>
  );
}

export function ProfileForm({
  initialName,
  email,
  initialPhone,
}: {
  initialName: string;
  email: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({ displayName: initialName, phone });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function cancel() {
    setPhone(initialPhone);
    setError(null);
    setEditing(false);
  }

  // ── View mode ──
  if (!editing) {
    return (
      <div className="space-y-5">
        <ReadRow label="Email" value={email} />
        <ReadRow label="Phone number" value={phone} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[13.5px] font-medium text-accent hover:underline"
        >
          Edit profile
        </button>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-[13px] font-medium text-fg">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="mt-1.5 h-11 w-full cursor-default rounded-[8px] border border-hairline bg-surface px-3.5 text-[14px] text-fg-muted focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-[13px] font-medium text-fg">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 98765 43210"
          autoFocus
          className="mt-1.5 h-11 w-full rounded-[8px] border border-hairline-strong bg-canvas px-3.5 text-[14px] text-fg transition-colors focus:outline-none focus-visible:border-accent"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={cancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-[13px] text-err">{error}</p>}
    </form>
  );
}
