"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPromptButton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary" | "accent" | "inverse";
  className?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "accepted">("idle");

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setStatus("ready");
    };

    const handleInstalled = () => {
      setStatus("accepted");
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const copy = useMemo(() => {
    if (status === "accepted") {
      return {
        label: "Installed",
        icon: Sparkles,
      };
    }

    if (status === "ready") {
      return {
        label: "Install Invios",
        icon: Download,
      };
    }

    return {
      label: "Install-ready shell",
      icon: Download,
    };
  }, [status]);

  const handleClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setStatus("accepted");
      setDeferredPrompt(null);
    }
  };

  const Icon = copy.icon;

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={!deferredPrompt && status !== "accepted"}
    >
      <Icon className="size-4" />
      {copy.label}
    </Button>
  );
}
