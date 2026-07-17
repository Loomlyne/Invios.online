"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasskeySignInButton() {
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "PublicKeyCredential" in window &&
        typeof window.PublicKeyCredential === "function",
    );
  }, []);

  if (!supported) return null;

  async function handleClick() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not fully configured.");
      return;
    }

    setPending(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPasskey();

    if (signInError) {
      setPending(false);
      if (signInError.name === "AbortError" || signInError.message?.includes("aborted")) {
        return;
      }
      setError(signInError.message || "Could not sign in with passkey.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Fingerprint className="size-4" />
        )}
        {pending ? "Waiting for passkey…" : "Sign in with a passkey"}
      </Button>
      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
    </div>
  );
}
