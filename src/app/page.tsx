import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { InstallPromptButton } from "@/components/app/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(28,25,23,0.08),transparent_18%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-20">
          <header className="glass-panel flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
            <Link href="/" className="display-text text-3xl font-semibold text-foreground">
              Invios
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-10 px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="accent" size="sm" className="h-10 px-4">
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          </header>

          <div className="mt-10 animate-enter space-y-7 lg:mt-14">
            <Badge variant="accent">Live billing workspace</Badge>
            <div className="max-w-3xl space-y-5">
              <h1 className="display-text text-5xl font-semibold leading-none text-balance text-foreground sm:text-6xl lg:text-7xl">
                The operator console for sending invoices that actually look worth paying.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-strong">
                Clients, quotations, invoices, branded PDFs, and public share links — one premium billing app for freelancers, consultants, and small agencies.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/sign-up">
                  Start your setup
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <InstallPromptButton variant="secondary" />
            </div>
          </div>
        </div>
      </section>

      {/* Workflow strip */}
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: BriefcaseBusiness,
              title: "Operator-first",
              text: "Run client records, quotations, invoices, and exports from one clean console.",
            },
            {
              icon: Smartphone,
              title: "Installable shell",
              text: "Built to feel clean and usable on phone widths and the home screen.",
            },
            {
              icon: ShieldCheck,
              title: "Trust cues",
              text: "Public links and PDFs match the same branded document renderer.",
            },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <item.icon className="size-5 text-accent" />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Product trust */}
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2rem] border border-black/10 bg-[#FCF8F1] px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
                Built for service businesses that sell trust before they sell time.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "TRN and invoice defaults live in setup, not hidden in a later admin panel.",
                "Installability is in scope now, but offline-first complexity is not.",
                "The shell is mobile-sharp from the first release.",
                "Invoices, quotations, public pages, and PDFs all reuse the same document renderer.",
              ].map((bullet) => (
                <div key={bullet} className="rounded-[1.3rem] border border-black/7 bg-white px-5 py-5 text-sm leading-7 text-muted-strong">
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[1400px] px-4 pb-18 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[2rem] border border-black/10 bg-[#1C1917] px-6 py-8 text-[#F8F4EE] soft-shadow sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="display-text text-3xl font-semibold sm:text-4xl">
                Add Invios to the home screen when you are ready to run it like an app.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#DDD4C6]">
                Manifest, icons, theme color, and app shell behaviors are already in place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <InstallPromptButton variant="accent" />
              <Button asChild variant="secondary" size="lg">
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
