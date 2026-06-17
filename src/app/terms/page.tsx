import Link from "next/link";
import type { Metadata } from "next";
import { InviosLogo } from "@/components/app/invios-logo";

export const metadata: Metadata = {
  title: "Terms of Service — Invios",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-[1400px] px-4 pb-0 pt-6 sm:px-6 lg:px-8">
        <div className="glass-panel flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
          <Link href="/"><InviosLogo /></Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="rounded-[0.85rem] px-4 py-2 text-sm font-medium text-muted-strong transition hover:bg-black/5 hover:text-foreground">Sign in</Link>
            <Link href="/pricing" className="rounded-[0.85rem] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">Pricing</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Legal</p>
        <h1 className="display-text mt-4 text-4xl font-semibold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 17, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-strong">

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using Invios ("the Service") at invios.online, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including visitors, registered users, and paying subscribers.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>Invios is a web-based invoicing and quotation platform designed for freelancers, solo operators, and small agencies. The Service allows users to create, manage, and share invoices, quotations, and client records. Features vary between the Free and Pro plans as described on our pricing page.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Account Registration</h2>
            <p>To access the Service you must create an account using a valid email address. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must be at least 18 years old to use the Service. You agree to provide accurate and complete information and to update it as necessary.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Free and Pro Plans</h2>
            <p>The Free plan allows up to 3 invoices, 3 quotations, and 2 clients at no cost. The Pro plan, billed at AED 50 per month, unlocks unlimited invoices, quotations, and clients, along with PDF/PNG export, recurring invoices, email reminders, analytics, and custom branding. Plan limits and features may be updated with reasonable notice.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Payment and Billing</h2>
            <p>Pro plan subscriptions are billed monthly at AED 50 through our payment processor, Paddle. By subscribing, you authorise Paddle to charge your payment method on a recurring monthly basis until you cancel. All prices are in UAE Dirhams (AED) and are inclusive of any applicable taxes. Failed payments may result in suspension of Pro access until payment is resolved.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Cancellation</h2>
            <p>You may cancel your Pro subscription at any time through the customer portal. Upon cancellation, your Pro access remains active until the end of the current billing period. After that, your account reverts to the Free plan. Your data is retained and accessible in read-only mode on the Free plan.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Refund Policy</h2>
            <p>We offer a 7-day refund on each monthly billing cycle. Please refer to our <Link href="/refund" className="text-accent underline underline-offset-4 hover:text-accent-strong">Refund Policy</Link> for full details and how to request a refund.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of others. Prohibited uses include: creating fraudulent invoices, impersonating another person or entity, attempting to gain unauthorised access to the Service, or using the Service in any way that could damage, disable, overburden, or impair it.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Intellectual Property</h2>
            <p>All content, trademarks, logos, and software associated with the Service are the property of Invios or its licensors. You retain ownership of your data — invoices, client information, and documents you create. You grant Invios a limited licence to store, process, and display your content solely to provide the Service.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Data and Privacy</h2>
            <p>Our use of your personal information is governed by our <Link href="/privacy" className="text-accent underline underline-offset-4 hover:text-accent-strong">Privacy Policy</Link>, which is incorporated into these Terms by reference. We employ industry-standard security practices to protect your data.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">11. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses. We do not warrant the accuracy of any financial documents generated through the Service — you are responsible for verifying all output.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">12. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Invios shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues arising out of your use of the Service. Our total liability for any claim arising from your use of the Service shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">13. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes via email or a prominent notice on the Service. Continued use of the Service after changes become effective constitutes your acceptance of the revised Terms.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">14. Governing Law</h2>
            <p>These Terms are governed by the laws of the United Arab Emirates. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of the UAE.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">15. Contact</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">legal@invios.online</a>.</p>
          </div>

        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>
          <Link href="/refund" className="underline underline-offset-4 hover:text-foreground">Refund Policy</Link>
          <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">Pricing</Link>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">Home</Link>
        </div>
      </section>
    </main>
  );
}
