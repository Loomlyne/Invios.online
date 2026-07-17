"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to Sentry and the browser console / monitoring without
    // exposing internals in the UI.
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Something went wrong
        </p>
        <h1 className="display-text text-3xl font-semibold text-foreground">
          We hit a snag loading this page.
        </h1>
        <p className="text-sm leading-7 text-muted-strong">
          This is on our side, not yours. Try again in a moment — if it keeps
          happening, sign in again or contact support@invios.online.
        </p>
        {error.digest && (
          <p className="text-xs text-muted/70">Reference: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="accent" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
