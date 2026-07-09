"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "@/lib/actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DisplayNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateDisplayName(name);
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
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <Field label="Display name" htmlFor="display-name">
        <Input
          id="display-name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={isPending}
        >
          Save
        </Button>
        {saved && <span className="text-[12px] text-fg-muted">Saved</span>}
      </div>
      {error && <p className="text-[13px] text-fg">{error}</p>}
    </form>
  );
}
