"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaveState = "idle" | "saving" | "saved";

export function SaveButton({
  isDirty,
  onSave,
}: {
  isDirty: boolean;
  onSave: () => Promise<void>;
}) {
  const [state, setState] = useState<SaveState>("idle");

  async function handleSave() {
    setState("saving");
    try {
      await onSave();
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  const disabled = !isDirty || state === "saving" || state === "saved";

  return (
    <>
      <Button onClick={handleSave} disabled={disabled}>
        {state === "saving" && <Loader2 className="size-4 animate-spin mr-2" />}
        {state === "saved" && <Check className="size-4 mr-2" />}
        {state === "saving"
          ? "Saving..."
          : state === "saved"
            ? "Saved"
            : "Save Changes"}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "saved" ? "Changes saved." : ""}
      </span>
    </>
  );
}
