"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { CoursePickerModal } from "@/components/curriculum/course-picker-modal";
import {
  offeringsFor,
  subjectHref,
  type PickerState,
  type SubjectLite,
} from "@/lib/curriculum";

interface CoursePickerCtx {
  /** Open the picker at a given entry point (a subject, or a degree). */
  openPicker: (initial: PickerState) => void;
  /** Go to a subject: direct if it has one offering, else open the picker. */
  goToSubject: (slug: string) => void;
}

const Ctx = createContext<CoursePickerCtx | null>(null);

export function useCoursePicker(): CoursePickerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCoursePicker must be used within CoursePickerProvider");
  return c;
}

export function CoursePickerProvider({
  subjects,
  children,
}: {
  subjects: SubjectLite[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<PickerState>({});

  const openPicker = useCallback((init: PickerState) => {
    setInitial(init);
    setOpen(true);
  }, []);

  const goToSubject = useCallback(
    (slug: string) => {
      const offs = offeringsFor(slug);
      if (offs.length <= 1) {
        router.push(subjectHref(slug, offs[0]?.degree, offs[0]?.level));
      } else {
        openPicker({ subject: slug });
      }
    },
    [router, openPicker],
  );

  return (
    <Ctx.Provider value={{ openPicker, goToSubject }}>
      {children}
      <CoursePickerModal
        open={open}
        initial={initial}
        subjects={subjects}
        onClose={() => setOpen(false)}
      />
    </Ctx.Provider>
  );
}
