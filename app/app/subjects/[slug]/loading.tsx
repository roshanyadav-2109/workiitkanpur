import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

/** Streamed instantly on navigation so the subject page never dead-clicks. */
export default function Loading() {
  return (
    <>
      <div className="relative left-1/2 mb-8 hidden w-[95vw] max-w-[1820px] -translate-x-1/2 md:block">
        <Skeleton className="h-[220px] w-full" />
      </div>
      <header className="mb-5">
        <Skeleton className="h-7 w-56" />
      </header>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>
      <SkeletonRows rows={10} />
    </>
  );
}
