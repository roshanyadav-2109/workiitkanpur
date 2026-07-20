"use client";

import { Button } from "@/components/ui/button";
import { usePhoneGate } from "@/components/phone/phone-gate";

/** Submit button for the mock-exam form that verifies a phone number first. */
export function ExamStartButton() {
  const gate = usePhoneGate();
  return (
    <Button
      type="submit"
      variant="primary"
      size="md"
      onClick={(e) => {
        if (gate.hasPhone) return; // let the form submit normally
        e.preventDefault();
        const form = e.currentTarget.form;
        gate.requirePhone(() => form?.requestSubmit());
      }}
    >
      Start exam
    </Button>
  );
}
