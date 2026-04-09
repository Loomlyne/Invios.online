"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ShareModalProps {
  publicPath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareModal({ publicPath, open, onOpenChange }: ShareModalProps) {
  const publicUrl =
    typeof window !== "undefined" ? window.location.origin + publicPath : publicPath;

  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyState("copied");
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!prefersReducedMotion) {
        setTimeout(() => setCopyState("idle"), 2000);
      } else {
        setCopyState("idle");
      }
    } catch {
      // fallback: no-op, button stays idle
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.6rem] p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Share</p>
          <h2 className="display-text mt-1 text-2xl font-semibold text-foreground">
            Public link
          </h2>
          <p className="mt-1 text-sm leading-7 text-muted">
            Anyone with this link can view the document without signing in.
          </p>
        </div>

        <div className="mt-4">
          <div className="rounded-[1rem] border border-border bg-[#FFF8EE] px-4 py-3">
            <p className="truncate font-mono text-sm text-muted-strong">{publicUrl}</p>
          </div>
        </div>

        <Button
          className="mt-3 w-full"
          variant={copyState === "idle" ? "accent" : "secondary"}
          onClick={handleCopy}
        >
          {copyState === "idle" ? (
            <Copy className="size-4" />
          ) : (
            <Check className="size-4" />
          )}
          {copyState === "idle" ? "Copy link" : "Copied"}
        </Button>

        <p className="mt-3 text-center">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-accent-strong"
          >
            Open in new tab
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
