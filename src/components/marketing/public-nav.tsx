import Link from "next/link";
import { headers } from "next/headers";
import { InviosLogo } from "@/components/app/invios-logo";
import { Button } from "@/components/ui/button";

export async function PublicNav({ cta = "signup" }: { cta?: "signup" | "pricing" }) {
  const h = await headers();
  const isSignedIn = Boolean(h.get("x-middleware-user-id"));
  const userEmail = h.get("x-middleware-user-email") ?? "";

  return (
    <header className="mx-auto max-w-[1400px] px-4 pb-0 pt-6 sm:px-6 lg:px-8">
      <nav className="glass-panel flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
        <Link href="/" aria-label="Invios home">
          <InviosLogo />
        </Link>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              {userEmail && (
                <span className="hidden max-w-[180px] truncate text-sm text-muted sm:block">
                  {userEmail}
                </span>
              )}
              <Button asChild variant="accent" size="sm" className="h-10 px-4">
                <Link href="/app">Dashboard</Link>
              </Button>
            </>
          ) : cta === "pricing" ? (
            <>
              <Button asChild variant="ghost" size="sm" className="h-10 px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="accent" size="sm" className="h-10 px-4">
                <Link href="/pricing">Pricing</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-10 px-4">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-10 px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="accent" size="sm" className="h-10 px-4">
                <Link href="/sign-up">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
