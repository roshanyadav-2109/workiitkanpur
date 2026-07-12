/**
 * Three tall vertical bars for a learner's coding profile (0–100 each).
 * Theme-aware; used in the "Your progress" card.
 */
export function SkillBars({
  values,
}: {
  values: { label: string; value: number }[];
}) {
  return (
    <div className="flex h-[160px] items-stretch gap-4">
      {values.map((v) => {
        const h = Math.max(4, Math.min(100, Math.round(v.value)));
        return (
          <div key={v.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="relative w-9 rounded-t-[4px] bg-gradient-to-t from-[#5a48d6] to-[#8b7bf0]"
                style={{ height: `${h}%` }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[12px] font-normal tabular-nums text-fg">
                  {Math.round(v.value)}
                </span>
              </div>
            </div>
            <div className="mt-2 text-center text-[11px] font-normal text-fg">
              {v.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
