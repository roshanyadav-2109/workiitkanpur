import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="mb-5">
        <Skeleton className="h-7 w-36" />
      </header>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md border border-hairline p-5">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <SkeletonRows rows={6} />
    </>
  );
}
