"use client";

import { useState } from "react";
import { IconChevron } from "@/components/icons";
import AE from "country-flag-icons/react/3x2/AE";
import AU from "country-flag-icons/react/3x2/AU";
import BD from "country-flag-icons/react/3x2/BD";
import BH from "country-flag-icons/react/3x2/BH";
import BR from "country-flag-icons/react/3x2/BR";
import CA from "country-flag-icons/react/3x2/CA";
import CH from "country-flag-icons/react/3x2/CH";
import CN from "country-flag-icons/react/3x2/CN";
import DE from "country-flag-icons/react/3x2/DE";
import EG from "country-flag-icons/react/3x2/EG";
import ES from "country-flag-icons/react/3x2/ES";
import FR from "country-flag-icons/react/3x2/FR";
import GB from "country-flag-icons/react/3x2/GB";
import HK from "country-flag-icons/react/3x2/HK";
import ID from "country-flag-icons/react/3x2/ID";
import IE from "country-flag-icons/react/3x2/IE";
import IL from "country-flag-icons/react/3x2/IL";
import IN from "country-flag-icons/react/3x2/IN";
import IT from "country-flag-icons/react/3x2/IT";
import JP from "country-flag-icons/react/3x2/JP";
import KE from "country-flag-icons/react/3x2/KE";
import KR from "country-flag-icons/react/3x2/KR";
import KW from "country-flag-icons/react/3x2/KW";
import LK from "country-flag-icons/react/3x2/LK";
import MX from "country-flag-icons/react/3x2/MX";
import MY from "country-flag-icons/react/3x2/MY";
import NG from "country-flag-icons/react/3x2/NG";
import NL from "country-flag-icons/react/3x2/NL";
import NP from "country-flag-icons/react/3x2/NP";
import NZ from "country-flag-icons/react/3x2/NZ";
import OM from "country-flag-icons/react/3x2/OM";
import PH from "country-flag-icons/react/3x2/PH";
import PK from "country-flag-icons/react/3x2/PK";
import QA from "country-flag-icons/react/3x2/QA";
import RU from "country-flag-icons/react/3x2/RU";
import SA from "country-flag-icons/react/3x2/SA";
import SE from "country-flag-icons/react/3x2/SE";
import SG from "country-flag-icons/react/3x2/SG";
import TH from "country-flag-icons/react/3x2/TH";
import TR from "country-flag-icons/react/3x2/TR";
import TW from "country-flag-icons/react/3x2/TW";
import US from "country-flag-icons/react/3x2/US";
import VN from "country-flag-icons/react/3x2/VN";
import ZA from "country-flag-icons/react/3x2/ZA";

type FlagComp = React.ComponentType<{ title?: string; className?: string }>;
const FLAGS: Record<string, FlagComp> = {
  AE, AU, BD, BH, BR, CA, CH, CN, DE, EG, ES, FR, GB, HK, ID, IE, IL, IN, IT,
  JP, KE, KR, KW, LK, MX, MY, NG, NL, NP, NZ, OM, PH, PK, QA, RU, SA, SE, SG,
  TH, TR, TW, US, VN, ZA,
};

function Flag({ iso, className }: { iso: string; className?: string }) {
  const C = FLAGS[iso];
  if (!C) return null;
  return <C className={className} />;
}

interface Country {
  iso: string;
  name: string;
  dial: string;
  /** Max digits in the national number (used to cap input length). */
  max: number;
}

// India first (default). A broad set covering most students' countries.
export const COUNTRIES: Country[] = [
  { iso: "IN", name: "India", dial: "+91", max: 10 },
  { iso: "US", name: "United States", dial: "+1", max: 10 },
  { iso: "GB", name: "United Kingdom", dial: "+44", max: 10 },
  { iso: "CA", name: "Canada", dial: "+1", max: 10 },
  { iso: "AU", name: "Australia", dial: "+61", max: 9 },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", max: 9 },
  { iso: "SA", name: "Saudi Arabia", dial: "+966", max: 9 },
  { iso: "SG", name: "Singapore", dial: "+65", max: 8 },
  { iso: "QA", name: "Qatar", dial: "+974", max: 8 },
  { iso: "KW", name: "Kuwait", dial: "+965", max: 8 },
  { iso: "OM", name: "Oman", dial: "+968", max: 8 },
  { iso: "BH", name: "Bahrain", dial: "+973", max: 8 },
  { iso: "NP", name: "Nepal", dial: "+977", max: 10 },
  { iso: "LK", name: "Sri Lanka", dial: "+94", max: 9 },
  { iso: "BD", name: "Bangladesh", dial: "+880", max: 10 },
  { iso: "PK", name: "Pakistan", dial: "+92", max: 10 },
  { iso: "CN", name: "China", dial: "+86", max: 11 },
  { iso: "JP", name: "Japan", dial: "+81", max: 10 },
  { iso: "KR", name: "South Korea", dial: "+82", max: 10 },
  { iso: "MY", name: "Malaysia", dial: "+60", max: 9 },
  { iso: "ID", name: "Indonesia", dial: "+62", max: 11 },
  { iso: "PH", name: "Philippines", dial: "+63", max: 10 },
  { iso: "TH", name: "Thailand", dial: "+66", max: 9 },
  { iso: "VN", name: "Vietnam", dial: "+84", max: 9 },
  { iso: "HK", name: "Hong Kong", dial: "+852", max: 8 },
  { iso: "TW", name: "Taiwan", dial: "+886", max: 9 },
  { iso: "NZ", name: "New Zealand", dial: "+64", max: 9 },
  { iso: "DE", name: "Germany", dial: "+49", max: 11 },
  { iso: "FR", name: "France", dial: "+33", max: 9 },
  { iso: "NL", name: "Netherlands", dial: "+31", max: 9 },
  { iso: "ES", name: "Spain", dial: "+34", max: 9 },
  { iso: "IT", name: "Italy", dial: "+39", max: 10 },
  { iso: "IE", name: "Ireland", dial: "+353", max: 9 },
  { iso: "CH", name: "Switzerland", dial: "+41", max: 9 },
  { iso: "SE", name: "Sweden", dial: "+46", max: 9 },
  { iso: "RU", name: "Russia", dial: "+7", max: 10 },
  { iso: "TR", name: "Turkey", dial: "+90", max: 10 },
  { iso: "EG", name: "Egypt", dial: "+20", max: 10 },
  { iso: "ZA", name: "South Africa", dial: "+27", max: 9 },
  { iso: "NG", name: "Nigeria", dial: "+234", max: 10 },
  { iso: "KE", name: "Kenya", dial: "+254", max: 9 },
  { iso: "BR", name: "Brazil", dial: "+55", max: 11 },
  { iso: "MX", name: "Mexico", dial: "+52", max: 10 },
  { iso: "IL", name: "Israel", dial: "+972", max: 9 },
];

export function countryFor(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
}

/** Split a stored "+91 9876543210" back into { iso, number }. */
export function parsePhone(raw: string): { iso: string; number: string } {
  const cleaned = (raw ?? "").replace(/[^\d+]/g, "");
  const byLongestDial = [...COUNTRIES].sort(
    (a, b) => b.dial.length - a.dial.length,
  );
  for (const c of byLongestDial) {
    if (cleaned.startsWith(c.dial)) {
      return { iso: c.iso, number: cleaned.slice(c.dial.length).slice(0, c.max) };
    }
  }
  return { iso: "IN", number: cleaned.replace(/\D/g, "").slice(0, 10) };
}

export function PhoneInput({
  iso,
  number,
  onIso,
  onNumber,
}: {
  iso: string;
  number: string;
  onIso: (v: string) => void;
  onNumber: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const country = countryFor(iso);
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase().trim()) ||
      c.dial.includes(q.trim()),
  );

  return (
    <div className="flex gap-2">
      {/* country selector */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`Country code, currently ${country.name} ${country.dial}`}
          className="flex h-11 items-center gap-1.5 rounded-[8px] border border-hairline-strong bg-canvas px-3 text-[14px] text-fg"
        >
          <Flag iso={country.iso} className="h-[15px] w-[22px] rounded-[2px]" />
          <span className="tnum">{country.dial}</span>
          <IconChevron size={13} className="rotate-90 text-fg-muted" />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-[10px] border border-hairline-strong bg-canvas shadow-[var(--shadow-overlay)]">
              <div className="border-b border-hairline p-2">
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search country"
                  className="h-9 w-full rounded-[7px] border border-hairline bg-surface px-3 text-[13px] focus:outline-none focus-visible:border-accent"
                />
              </div>
              <ul className="max-h-60 overflow-auto p-1">
                {filtered.map((c) => (
                  <li key={c.iso}>
                    <button
                      type="button"
                      onClick={() => {
                        onIso(c.iso);
                        onNumber(number.slice(0, c.max));
                        setOpen(false);
                        setQ("");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13.5px] hover:bg-surface"
                    >
                      <Flag iso={c.iso} className="h-[15px] w-[22px] shrink-0 rounded-[2px]" />
                      <span className="flex-1 truncate text-fg">{c.name}</span>
                      <span className="tnum text-[12.5px] text-fg-muted">
                        {c.dial}
                      </span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-2.5 py-3 text-center text-[13px] text-fg-muted">
                    No matches
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* national number */}
      <input
        type="tel"
        inputMode="numeric"
        value={number}
        onChange={(e) =>
          onNumber(e.target.value.replace(/\D/g, "").slice(0, country.max))
        }
        maxLength={country.max}
        placeholder={`${country.max}-digit number`}
        aria-label="Phone number"
        className="h-11 flex-1 rounded-[8px] border border-hairline-strong bg-canvas px-3.5 text-[14px] text-fg transition-colors focus:outline-none focus-visible:border-accent"
      />
    </div>
  );
}
