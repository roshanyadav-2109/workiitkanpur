"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "./phone-input";
import { parsePhone, countryFor } from "@/lib/phone";

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
  const parsed = parsePhone(initialPhone);
  const [editing, setEditing] = useState(false);
  const [iso, setIso] = useState(parsed.iso);
  const [number, setNumber] = useState(parsed.number);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const country = countryFor(iso);
  // Stored as a single string: country code + number (no flag). e.g. "+91 9876543210".
  const combined = number.trim() ? `${country.dial} ${number}` : "";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // A partial number is invalid — require the full national length before saving.
    if (number.length > 0 && number.length < country.max) {
      setError(
        `Enter a full ${country.max}-digit phone number for ${country.name}.`,
      );
      return;
    }
    startTransition(async () => {
      const res = await updateProfile({ displayName: initialName, phone: combined });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function cancel() {
    const p = parsePhone(initialPhone);
    setIso(p.iso);
    setNumber(p.number);
    setError(null);
    setEditing(false);
  }

  // ── View mode ──
  if (!editing) {
    return (
      <div className="space-y-5">
        <ReadRow label="Email" value={email} />
        <ReadRow label="Phone number" value={initialPhone} />
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
        <label className="block text-[13px] font-medium text-fg">
          Phone number
        </label>
        <div className="mt-1.5">
          <PhoneInput
            iso={iso}
            number={number}
            onIso={setIso}
            onNumber={setNumber}
          />
        </div>
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
