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
      className="group inline-flex h-14 items-center gap-3 rounded-[10px] border-2 border-[#3d3d3d] px-5 text-[15px] font-semibold transition-colors hover:bg-surface"
    >
      <SubjectLogo
        slug={subject.slug}
        size={24}
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
        "rounded-[10px] border-2 border-[#3d3d3d] px-4 py-6 text-center transition-colors",
        disabled ? "opacity-50" : "hover:bg-surface",
      )}
    >
      <div className="text-[16px] font-semibold leading-snug sm:text-[17px]">
        {name}
      </div>
      <div className="mt-1.5 text-[12.5px] text-fg-muted sm:text-[13px]">
        {note}
      </div>
    </button>
  );
}
