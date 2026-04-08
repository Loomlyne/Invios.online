"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { completeOnboardingAction, dismissSetupChecklistAction } from "@/actions/app";
import { Button } from "@/components/ui/button";
import type { AppContext } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetupChecklist({ context }: { context: AppContext }) {
  const router = useRouter();
  const [open, setOpen] = useState(!context.setupProgress.complete);
  const [autoCompleting, setAutoCompleting] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setOpen(!context.setupProgress.complete);
  }, [context.setupProgress.complete]);

  useEffect(() => {
    if (
      !context.setupProgress.readyForCompletion ||
      context.setupProgress.complete ||
      autoTriggered ||
      autoCompleting
    ) {
      return;
    }

    setAutoTriggered(true);
    setAutoCompleting(true);
    startTransition(async () => {
      const result = await completeOnboardingAction();
      setAutoCompleting(false);

      if (result.status === "success") {
        setOpen(false);
        router.refresh();
        return;
      }

      setAutoTriggered(false);
    });
  }, [
    autoCompleting,
    autoTriggered,
    context.setupProgress.complete,
    context.setupProgress.readyForCompletion,
    router,
  ]);

  const title = useMemo(() => {
    if (context.setupProgress.complete) {
      return "Setup complete";
    }

    if (autoCompleting) {
      return "Finalizing setup";
    }

    return "Setup checklist";
  }, [autoCompleting, context.setupProgress.complete]);

  if (dismissed || context.setupChecklistDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm lg:bottom-6 lg:right-6">
      <div className="overflow-hidden rounded-[1.45rem] border border-black/10 bg-white/96 shadow-[0_24px_60px_rgba(23,18,15,0.18)] backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                context.setupProgress.complete ? "bg-[#E7F4EC] text-success" : "bg-accent-soft text-accent-strong",
              )}
            >
              {autoCompleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : context.setupProgress.complete ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Sparkles className="size-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted">
                {context.setupProgress.completedCount}/{context.setupProgress.totalCount} complete
              </p>
            </div>
          </div>
          {open ? <ChevronDown className="size-4 text-muted" /> : <ChevronUp className="size-4 text-muted" />}
        </button>

        {open ? (
          <div className="border-t border-black/6 px-4 py-4">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#F3EBDD]">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${context.setupProgress.percentage}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {context.setupProgress.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 rounded-[1rem] border px-3 py-3 transition",
                    item.complete
                      ? "border-[#DCEBDD] bg-[#F6FBF6]"
                      : "border-border bg-[#FFFCF7] hover:border-[#D7C4A7] hover:bg-[#FFF8ED]",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      item.complete
                        ? "border-success bg-success text-white"
                        : "border-[#D7C4A7] bg-white text-transparent",
                    )}
                  >
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {context.setupProgress.complete ? (
              <div className="mt-4">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => {
                    setDismissed(true);
                    startTransition(async () => { await dismissSetupChecklistAction(); });
                  }}
                >
                  Finish
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/app/settings?section=profile">Open setup settings</Link>
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
