import { EmptyState } from "@/components/ui/empty-state";

/** Shown only to an account that opens questions far faster than anyone studies. */
export function SlowDown() {
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-16">
      <EmptyState
        title="You're opening questions very quickly"
        description="Take a short break and try again in an hour. Questions you opened today stay open."
      />
    </div>
  );
}
