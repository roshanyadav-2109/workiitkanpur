// Country dial codes + national-number lengths. Pure data/logic (no React),
// so it can be used from both server and client components.

export interface Country {
  iso: string;
  name: string;
  dial: string;
  /** Max digits in the national number (used to cap + validate input). */
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
