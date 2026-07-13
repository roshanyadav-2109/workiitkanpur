"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function DisplayNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = name.trim() !== initial.trim() && name.trim().length > 0;

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
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        id="display-name"
        value={name}
        maxLength={80}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        placeholder="Your name"
        aria-label="Display name"
        className="h-11 w-full rounded-[8px] border border-hairline-strong bg-canvas px-3.5 text-[14px] text-fg transition-colors focus:outline-none focus-visible:border-accent"
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isPending || !dirty}
        >
          {isPending ? "Saving…" : "Save name"}
        </Button>
        {saved && (
          <span className="text-[12.5px] font-medium text-ok">Saved ✓</span>
        )}
      </div>
      {error && <p className="text-[13px] text-err">{error}</p>}
    </form>
  );
}
