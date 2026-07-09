"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SubjectLogo } from "@/components/subject-logo";
import { useCoursePicker } from "@/components/curriculum/course-picker-provider";
import type { SubjectLite } from "@/lib/curriculum";

/** Big subject block: goes straight in if unambiguous, else opens the picker. */
export function SubjectBlock({ subject }: { subject: SubjectLite }) {
  const router = useRouter();
  const { goToSubject } = useCoursePicker();

  return (
    <button
      onClick={() =>
        subject.is_active ? goToSubject(subject.slug) : router.push("/app/subjects")
      }
      className="group inline-flex h-16 items-center gap-3.5 rounded-md border border-hairline-strong px-6 text-[16px] font-medium transition-colors hover:bg-surface"
    >
      <SubjectLogo
        slug={subject.slug}
        size={28}
        className={subject.is_active ? "" : "opacity-50"}
      />
      <span className={subject.is_active ? "" : "text-fg-muted"}>
        {subject.name}
      </span>
      {!subject.is_active && (
        <span className="text-[11px] font-normal text-fg-faint">soon</span>
      )}
    </button>
  );
}

/** Available-branch block: opens the picker to choose a subject in that degree. */
export function BranchBlock({
  degreeId,
  name,
  note,
}: {
  degreeId: string | null;
  name: string;
  note: string;
}) {
  const { openPicker } = useCoursePicker();
  const disabled = !degreeId;

  return (
    <button
      disabled={disabled}
      onClick={() => degreeId && openPicker({ degree: degreeId })}
      className={cn(
        "rounded-md border border-hairline px-4 py-6 text-center transition-colors",
        disabled ? "opacity-70" : "hover:bg-surface hover:border-hairline-strong",
      )}
    >
      <div className="text-[14px] font-medium leading-snug sm:text-[15px]">
        {name}
      </div>
      <div className="mt-1.5 text-[11px] text-fg-muted sm:text-[12px]">{note}</div>
    </button>
  );
}
