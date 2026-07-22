import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <header className="mb-5">
        <Skeleton className="h-7 w-40" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-md border border-hairline p-5">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </>
  );
}
