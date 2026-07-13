"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  /** Full public URL, e.g. https://invios.online/invoices/public/abc123 */
  publicUrl: string;
  /** Document number for the WhatsApp message, e.g. "INV-0001" */
  documentNumber: string;
  /** Optional total + currency for a richer message */
  amountLabel?: string;
  /** "invoice" | "quotation" — controls wording */
  documentKind: "invoice" | "quotation";
  variant?: "primary" | "secondary" | "ghost" | "inverse" | "accent" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export function ShareButton({
  publicUrl,
  documentNumber,
  amountLabel,
  documentKind,
  variant = "secondary",
  size = "sm",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const kindLabel = documentKind === "invoice" ? "invoice" : "quotation";

  const message = amountLabel
    ? `Your ${kindLabel} ${documentNumber} for ${amountLabel} is ready: ${publicUrl}`
    : `Your ${kindLabel} ${documentNumber} is ready: ${publicUrl}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can fail in non-secure contexts — fallback to WhatsApp
      window.open(whatsappHref, "_blank");
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant={variant} size={size} onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="size-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Copy link
          </>
        )}
      </Button>
      <Button asChild variant={variant} size={size}>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
