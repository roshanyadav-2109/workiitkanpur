"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { IconClose } from "@/components/icons";

/**
 * A floating, user-movable and user-resizable notes panel for the current
 * question. Drag it by the header; resize from the bottom-right corner.
 */
export function FloatingNotes({
  title,
  note,
  onNoteChange,
  onSave,
  saving,
  saved,
  rating,
  setRating,
  isAuthed,
  onClose,
}: {
  title: string;
  note: string;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  rating: number | null;
  setRating: (updater: (r: number | null) => number | null) => void;
  isAuthed: boolean;
  onClose: () => void;
}) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 372),
    y: 92,
  }));
  const [size, setSize] = useState({ w: 340, h: 396 });

  function startDrag(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = pos.x;
    const oy = pos.y;
    function move(ev: PointerEvent) {
      setPos({
        x: Math.min(Math.max(0, ox + ev.clientX - sx), window.innerWidth - 80),
        y: Math.min(Math.max(0, oy + ev.clientY - sy), window.innerHeight - 36),
      });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const ow = size.w;
    const oh = size.h;
    function move(ev: PointerEvent) {
      setSize({
        w: Math.max(260, ow + ev.clientX - sx),
        h: Math.max(240, oh + ev.clientY - sy),
      });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      role="dialog"
      aria-label="Question notes"
      className="fixed z-50 flex flex-col overflow-hidden rounded-[3px] border border-hairline-strong bg-canvas shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, touchAction: "none" }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-move select-none items-center justify-between gap-2 border-b border-hairline px-3 py-2"
      >
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-fg">Notes</div>
          <div className="truncate text-[11px] text-fg-muted">{title}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close notes"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
        >
          <IconClose size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Jot the approach, a gotcha, the edge case you missed…"
          className="min-h-[96px] flex-1 text-[13px] text-fg"
          disabled={!isAuthed}
        />
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={onSave}
            disabled={saving}
          >
            {isAuthed ? "Save note" : "Sign in to save"}
          </Button>
          {saved && <span className="text-[12px] text-fg-muted">Saved</span>}
        </div>
        <div>
          <div className="mb-2 text-[12px] font-medium text-fg">
            How hard did it feel?
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Rate ${n} of 5`}
                onClick={() => setRating((r) => (r === n ? null : n))}
                className={cn(
                  "h-8 w-8 rounded-md border text-[13px] tnum transition-colors",
                  rating !== null && n <= rating
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-hairline-strong text-fg hover:bg-surface",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        onPointerDown={startResize}
        aria-hidden
        className="absolute bottom-0 right-0 grid h-5 w-5 cursor-nwse-resize place-items-center text-fg-faint"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path
            d="M10 13 L13 10 M6 13 L13 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
