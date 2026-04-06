"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-10 px-4"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
          router.replace("/sign-in");
        });
      }}
    >
      Sign out
    </Button>
  );
}
