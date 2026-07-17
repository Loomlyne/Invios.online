"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Async "Email PDF" fallback button. POSTs to the email-pdf endpoint which
 * generates the PDF server-side and emails it, so the user is never blocked
 * waiting on a slow cold-start export.
 */
export function EmailPdfButton({ endpoint }: { endpoint: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const label =
    status === "sending"
      ? "Sending…"
      : status === "sent"
        ? "Sent!"
        : status === "error"
          ? "Failed"
          : "Email PDF";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleSend}
      disabled={status === "sending"}
    >
      <Mail className="size-4" />
      {label}
    </Button>
  );
}
