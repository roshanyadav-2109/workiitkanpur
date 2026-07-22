import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the IDE's two-column split so the swap is not a jump. */
export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <Skeleton className="mb-4 h-6 w-2/3" />
        <div className="space-y-2.5">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-3"
              style={{ width: `${95 - ((i * 17) % 45)}%` }}
            />
          ))}
        </div>
      </div>
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
