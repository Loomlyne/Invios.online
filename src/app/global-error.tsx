"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Global error boundary. This replaces the ROOT layout when an error is thrown
 * in the root layout itself, so it must render its own <html>/<body> and cannot
 * rely on the app's global stylesheet — styles are inlined.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#f8f4ee",
          color: "#3a322c",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.95rem", color: "#6b6359" }}>
          A critical error interrupted the app. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            cursor: "pointer",
            borderRadius: "0.5rem",
            border: "none",
            backgroundColor: "#ca8a04",
            color: "#ffffff",
            padding: "0.6rem 1.4rem",
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
