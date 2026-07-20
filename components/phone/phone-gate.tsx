"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PhoneInput } from "@/components/settings/phone-input";
import { countryFor } from "@/lib/phone";
import { savePhone } from "@/lib/actions";

interface GateCtx {
  /** Run `onOk` immediately if a phone is on file, otherwise ask for one first. */
  requirePhone: (onOk: () => void) => void;
  hasPhone: boolean;
}

const Ctx = createContext<GateCtx | null>(null);

/** Optional — components not wrapped in the provider just run their action. */
export function usePhoneGate(): GateCtx {
  return (
    useContext(Ctx) ?? {
      requirePhone: (onOk) => onOk(),
      hasPhone: true,
    }
  );
}

/** Bespoke artwork for the gate: a handset with the number still to be filled
 *  in, and the verified badge waiting on its corner. Same visual language as
 *  the dashboard empty states. */
function PhoneArt() {
  return (
    <svg
      viewBox="0 0 88 92"
      className="mb-3 h-[72px] w-auto"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="pg-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7bf0" />
          <stop offset="100%" stopColor="#5a48d6" />
        </linearGradient>
      </defs>

      {/* handset — a touch heavier than the dashboard artwork, which is drawn
          at nearly twice this size */}
      <rect
        x="14"
        y="6"
        width="46"
        height="80"
        rx="9"
        fill="#ffffff"
        stroke="#5a48d6"
        strokeOpacity="0.32"
        strokeWidth="1.5"
      />

      {/* earpiece */}
      <line
        x1="31"
        y1="15"
        x2="43"
        y2="15"
        stroke="#5a48d6"
        strokeOpacity="0.32"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* the number, still to be filled in */}
      {[34, 46, 58].map((y) => (
        <line
          key={y}
          x1="24"
          y1={y}
          x2="48"
          y2={y}
          stroke="#5a48d6"
          strokeOpacity="0.24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="3 5"
        />
      ))}

      {/* home indicator */}
      <line
        x1="31"
        y1="78"
        x2="43"
        y2="78"
        stroke="#5a48d6"
        strokeOpacity="0.26"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* verified badge, overlapping the corner — the ring keeps a clean gap */}
      <circle cx="63" cy="67" r="15" fill="var(--color-canvas, #ffffff)" />
      <circle cx="63" cy="67" r="11.5" fill="url(#pg-badge)" />
      <path
        d="M57.5 67.2 L61.4 71 L68.5 63.5"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneGateProvider({
  hasPhone: initialHasPhone,
  children,
}: {
  hasPhone: boolean;
  children: ReactNode;
}) {
  const [hasPhone, setHasPhone] = useState(initialHasPhone);
  const [open, setOpen] = useState(false);
  const [iso, setIso] = useState("IN");
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  function requirePhone(onOk: () => void) {
    if (hasPhone) {
      onOk();
      return;
    }
    pending.current = onOk;
    setError(null);
    setOpen(true);
  }

  function dismiss() {
    setOpen(false);
    pending.current = null;
  }

  async function submit() {
    const country = countryFor(iso);
    if (number.length < country.max) {
      setError(`Enter your ${country.max}-digit number to continue.`);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await savePhone(`${country.dial} ${number}`);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save. Please try again.");
      return;
    }
    setHasPhone(true);
    setOpen(false);
    const cb = pending.current;
    pending.current = null;
    cb?.();
  }

  return (
    <Ctx.Provider value={{ requirePhone, hasPhone }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            className="absolute inset-0 bg-black/40"
          />
          {/* card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-gate-title"
            className="relative w-full max-w-[400px] rounded-[12px] border-2 border-[#3d3d3d] bg-canvas p-5 sm:p-6"
          >
            <PhoneArt />
            <h2
              id="phone-gate-title"
              className="text-[19px] font-semibold tracking-[-0.01em] text-fg"
            >
              Verify your phone number
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">
              Add your phone number once to continue. We use it to confirm it&apos;s
              really you before you practise.
            </p>

            <div className="mt-4">
              <PhoneInput
                iso={iso}
                number={number}
                onIso={setIso}
                onNumber={(v) => {
                  setNumber(v);
                  if (error) setError(null);
                }}
              />
              {error && (
                <p className="mt-2 text-[13px] font-medium text-err">{error}</p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="h-11 rounded-[8px] px-4 text-[14px] font-medium text-fg-muted hover:text-fg"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="h-11 rounded-[8px] bg-gradient-to-b from-[#6d5ce2] to-[#5a48d6] px-5 text-[14px] font-semibold text-white ring-1 ring-inset ring-white/20 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
