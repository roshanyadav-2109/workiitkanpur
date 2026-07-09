"use client";

import { useState } from "react";
import { CoursePickerModal } from "@/components/curriculum/course-picker-modal";
import type { SubjectLite } from "@/lib/curriculum";

/**
 * Shown on a subject's questions page: the degree/level context the learner
 * arrived through, with a "Change" that re-opens the picker (only when the
 * subject is offered in more than one context).
 */
export function SubjectContextBar({
  slug,
  degreeName,
  level,
  canChange,
  subjects,
}: {
  slug: string;
  degreeName?: string;
  level?: string;
  canChange: boolean;
  subjects: SubjectLite[];
}) {
  const [open, setOpen] = useState(false);
  const hasContext = !!degreeName || !!level;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-fg-muted">Context</span>
        {hasContext ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-hairline px-2.5 py-1">
            {degreeName && <span className="font-medium">{degreeName}</span>}
            {degreeName && level && <span className="text-fg-faint">·</span>}
            {level && <span className="text-fg-muted">{level}</span>}
          </span>
        ) : (
          <span className="text-fg-muted">All</span>
        )}
        {canChange && (
          <button
            onClick={() => setOpen(true)}
            className="text-accent underline underline-offset-2"
          >
            Change
          </button>
        )}
      </div>

      <CoursePickerModal
        open={open}
        initial={{ subject: slug }}
        subjects={subjects}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
