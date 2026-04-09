import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
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
      <div className="mx-auto grid min-h-screen max-w-[1400px] gap-8 px-4 py-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[#1C1917] px-6 py-8 text-[#F8F4EE] soft-shadow sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.28),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_30%)]" />
          <div className="relative flex h-full flex-col">
            <Link href="/">
              <InviosLogo />
            </Link>

            <div className="mt-14 max-w-md space-y-5">
              <h1 className="display-text text-4xl font-semibold leading-tight text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="text-sm leading-7 text-[#DDD4C6]">
                {description}
              </p>
            </div>

            <ul className="mt-10 space-y-3 text-sm leading-7 text-[#DDD4C6]">
              <li>Branded invoices and quotations</li>
              <li>Public share links and PDF export</li>
              <li>UAE-ready defaults out of the box</li>
            </ul>

            <div className="mt-auto flex items-center gap-3 pt-10 text-sm text-[#DDD4C6]">
              <span>Already configured?</span>
              <Link href="/sign-in" className="inline-flex items-center gap-2 text-[#F7CB6A]">
                Open the console
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg rounded-[2rem] border border-black/10 bg-white/88 p-6 soft-shadow sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
