"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Catches render/runtime errors thrown by any
 * segment below the root layout and shows a branded recovery screen instead
 * of the bare "Application error" white page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console (and any attached monitoring) so failures are
    // observable rather than silent.
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted">
          An unexpected error interrupted this page. You can try again, or head
          back to your dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted/70">Reference: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <a href="/app">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
