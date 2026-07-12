/**
 * Compact 4-axis radar showing a learner's "coding profile" — accuracy, speed,
 * consistency and coverage, each 0–100. Pure SVG, theme-aware via CSS vars.
 */
export function SkillRadar({
  values,
}: {
  values: { label: string; value: number }[];
}) {
  const cx = 120;
  const cy = 78;
  const R = 48;
  const n = values.length;
  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const pt = (i: number, frac: number): [number, number] => [
    cx + Math.cos(angle(i)) * R * frac,
    cy + Math.sin(angle(i)) * R * frac,
  ];
  const ring = (frac: number) =>
    values.map((_, i) => pt(i, frac).join(",")).join(" ");
  const dataPoly = values
    .map((v, i) => pt(i, Math.max(0, Math.min(100, v.value)) / 100).join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 240 164" className="mx-auto block h-[140px] w-full">
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ring(f)}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="1"
        />
      ))}
      {/* axes */}
      {values.map((_, i) => {
        const [x, y] = pt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--hairline)"
            strokeWidth="1"
          />
        );
      })}
      {/* data polygon */}
      <polygon
        points={dataPoly}
        fill="var(--accent)"
        fillOpacity="0.18"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = pt(i, Math.max(0, Math.min(100, v.value)) / 100);
        return <circle key={i} cx={x} cy={y} r="2.6" fill="var(--accent)" />;
      })}
      {/* labels */}
      {values.map((v, i) => {
        const [x, y] = pt(i, 1.34);
        const anchor =
          Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end";
        return (
          <text
            key={v.label}
            x={x}
            y={y + 3}
            textAnchor={anchor}
            fontSize="10.5"
            fontWeight="600"
            fill="var(--fg-muted)"
          >
            {v.label}
          </text>
        );
      })}
    </svg>
  );
}
