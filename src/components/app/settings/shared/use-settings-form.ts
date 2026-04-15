"use client";

import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import type { ActionState } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved";

/**
 * Per-section settings form hook.
 * Encapsulates dirty detection (useRef snapshot), update helpers,
 * and save with startTransition + inline state machine (idle → saving → saved).
 */
export function useSettingsForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSave: (values: T) => Promise<ActionState>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const snapshot = useRef<T>(initialValues);

  const isDirty = useMemo(() => {
    const s = snapshot.current;
    return Object.keys(s).some(
      (k) => values[k as keyof T] !== s[k as keyof T],
    );
  }, [values]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setSaveState("saving");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await onSave(values);
        if (result.status === "success") {
          snapshot.current = { ...values };
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 2000);
        } else {
          setMessage(result.message ?? "Failed to save");
          setSaveState("idle");
        }
      } catch {
        setMessage("An unexpected error occurred");
        setSaveState("idle");
      }
    });
  }, [values, onSave]);

  const reset = useCallback(() => {
    setValues(snapshot.current);
    setMessage("");
  }, []);

  return { values, update, isDirty, save, saveState, message, reset };
}
