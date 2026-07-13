"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions";
import { Button } from "@/components/ui/button";

function LabeledInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={
          "mt-1.5 h-11 w-full rounded-[8px] border px-3.5 text-[14px] text-fg transition-colors focus:outline-none " +
          (readOnly
            ? "cursor-default border-hairline bg-surface text-fg-muted"
            : "border-hairline-strong bg-canvas focus-visible:border-accent")
        }
      />
      {hint && <p className="mt-1 text-[12px] text-fg-muted">{hint}</p>}
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
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    (name.trim() !== initialName.trim() && name.trim().length > 0) ||
    phone.trim() !== initialPhone.trim();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({ displayName: name, phone });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        window.setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <LabeledInput
        id="name"
        label="Name"
        value={name}
        onChange={(v) => {
          setName(v);
          setSaved(false);
        }}
        placeholder="Your name"
      />
      <LabeledInput
        id="email"
        label="Email"
        value={email}
        type="email"
        readOnly
        hint="Comes from the account you signed in with."
      />
      <LabeledInput
        id="phone"
        label="Phone number"
        value={phone}
        type="tel"
        onChange={(v) => {
          setPhone(v);
          setSaved(false);
        }}
        placeholder="e.g. +91 98765 43210"
      />

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isPending || !dirty}
        >
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {saved && (
          <span className="text-[13px] font-medium text-ok">Saved ✓</span>
        )}
      </div>
      {error && <p className="text-[13px] text-err">{error}</p>}
    </form>
  );
}
