/**
 * A small 2D medal badge for the top-3 ranks — a metal disc with a ribbon and
 * the rank number. Gold / silver / bronze by rank.
 */
const METAL: Record<number, { main: string; dark: string; light: string }> = {
  1: { main: "#f5c542", dark: "#d99400", light: "#ffe595" },
  2: { main: "#c2c9d6", dark: "#9099a8", light: "#eef1f6" },
  3: { main: "#cd7f32", dark: "#9c5a1f", light: "#e6a765" },
};

export function RankMedal({
  rank,
  className = "h-9 w-auto",
}: {
  rank: number;
  className?: string;
}) {
  const m = METAL[rank] ?? METAL[3];
  return (
    <svg viewBox="0 0 30 40" className={className} aria-label={`Rank ${rank}`}>
      {/* ribbons */}
      <polygon points="9,1 13,1 17,18 13,18" fill="#7b6ce0" />
      <polygon points="21,1 17,1 13,18 17,18" fill="#5a48d6" />
      {/* medal disc */}
      <circle cx="15" cy="26" r="12" fill={m.main} stroke={m.dark} strokeWidth="1.5" />
      <circle
        cx="15"
        cy="26"
        r="8.6"
        fill="none"
        stroke={m.light}
        strokeWidth="1.3"
        opacity="0.8"
      />
      {/* shine */}
      <path
        d="M9 22 a8.6 8.6 0 0 1 6 -4"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        x="15"
        y="30.5"
        textAnchor="middle"
        fontSize="12.5"
        fontWeight="800"
        fill="#3a2a06"
        fillOpacity={rank === 2 ? "0.7" : "0.85"}
      >
        {rank}
      </text>
    </svg>
  );
}
