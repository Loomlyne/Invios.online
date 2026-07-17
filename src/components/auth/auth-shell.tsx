import Link from "next/link";
import type { ReactNode } from "react";
import { InviosLogo } from "@/components/app/invios-logo";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-grid">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 py-6">
        <Link href="/">
          <InviosLogo />
        </Link>

        <div className="max-w-md space-y-2 text-center">
          <h1 className="display-text text-3xl font-semibold leading-tight text-balance">
            {title}
          </h1>
          <p className="text-sm leading-7 text-muted">
            {description}
          </p>
        </div>

        <div className="w-full rounded-[2rem] border border-black/10 bg-white/88 p-6 soft-shadow sm:p-8">
          {children}
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
          <Link href="/terms" className="transition hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="transition hover:text-foreground">Privacy Policy</Link>
          <a href="mailto:support@invios.online" className="transition hover:text-foreground">support@invios.online</a>
        </div>
      </div>
    </main>
  );
}
