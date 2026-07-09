"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStopwatch } from "@/lib/use-stopwatch";
import { recordAttempt, saveNote } from "@/lib/actions";
import { RuntimeArea } from "@/components/execution/runtime-area";
import { ControlsPanel } from "@/components/question/controls-panel";
import type {
  GradeResult,
  RuntimeQuestion,
} from "@/components/execution/types";
import type { QuestionStatus } from "@/components/ui/status";

export function QuestionWorkspace({
  question,
  isAuthed,
  initialStatus,
  initialNote,
  initialBestSeconds,
  bodySlot,
  solutionSlot,
}: {
  question: RuntimeQuestion;
  isAuthed: boolean;
  initialStatus: QuestionStatus;
  initialNote: string;
  initialBestSeconds: number | null;
  bodySlot: React.ReactNode;
  solutionSlot: React.ReactNode;
}) {
  const router = useRouter();
  const { seconds, running, toggle, reset } = useStopwatch(0, true);
  const [status, setStatus] = useState<QuestionStatus>(initialStatus);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [lastSolveSeconds, setLastSolveSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoSolved = useRef(false);

  const loginHref = `/login?next=${encodeURIComponent(`/app/questions/${question.id}`)}`;

  function record(next: "attempted" | "solved", isCorrect: boolean | null) {
    const at = seconds;
    startTransition(async () => {
      const res = await recordAttempt({
        questionId: question.id,
        status: next,
        timeSpentSeconds: at,
        selfRating: rating,
        isCorrect,
      });
      if (res.ok) {
        setStatus(next);
        if (next === "solved") setLastSolveSeconds(at);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function mark(next: "attempted" | "solved") {
    setError(null);
    if (!isAuthed) {
      router.push(loginHref);
      return;
    }
    // A manual solve also satisfies the one-time auto-solve guard, so a later
    // all-passing test run does not record a second solved attempt.
    if (next === "solved") autoSolved.current = true;
    record(next, next === "solved" ? true : null);
  }

  // Passing every test (or the correct MCQ) auto-records a solve, once.
  function handleGraded(r: GradeResult) {
    if (r.correct && !autoSolved.current && status !== "solved") {
      autoSolved.current = true;
      if (isAuthed) record("solved", true);
      else {
        setStatus("solved");
        setLastSolveSeconds(seconds);
      }
    }
  }

  function onSaveNote() {
    setError(null);
    if (!isAuthed) {
      router.push(loginHref);
      return;
    }
    startTransition(async () => {
      const res = await saveNote({ questionId: question.id, content: note });
      if (res.ok) {
        setNoteSaved(true);
        window.setTimeout(() => setNoteSaved(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {bodySlot}
        <RuntimeArea
          question={question}
          mode="practice"
          onGraded={handleGraded}
        />
        {solutionSlot}
      </div>

      <aside className="lg:col-span-1">
        <div className="lg:sticky lg:top-20">
          <ControlsPanel
            isAuthed={isAuthed}
            status={status}
            seconds={seconds}
            running={running}
            onToggle={toggle}
            onReset={reset}
            rating={rating}
            onRate={setRating}
            onMark={mark}
            note={note}
            onNoteChange={setNote}
            onSaveNote={onSaveNote}
            noteSaved={noteSaved}
            lastSolveSeconds={lastSolveSeconds}
            bestSeconds={initialBestSeconds}
            error={error}
            isPending={isPending}
            loginHref={loginHref}
          />
        </div>
      </aside>
    </div>
  );
}
