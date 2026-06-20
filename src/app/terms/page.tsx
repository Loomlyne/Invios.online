import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service — Invios",
};

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "description", label: "Description of Service" },
  { id: "registration", label: "Account Registration" },
  { id: "plans", label: "Free and Pro Plans" },
  { id: "payment", label: "Payment and Billing" },
  { id: "cancellation", label: "Cancellation" },
  { id: "refund-policy", label: "Refund Policy" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "data-privacy", label: "Data and Privacy" },
  { id: "disclaimer", label: "Disclaimer of Warranties" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "changes", label: "Changes to Terms" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <PublicNav cta="pricing" />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <Badge variant="accent">Legal</Badge>
          <h1 className="display-text mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: June 17, 2026</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-strong">
            By using Invios you agree to these terms. Please read them carefully before accessing the Service.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">

          {/* Sticky ToC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">On this page</p>
              <nav className="mt-4 space-y-0.5">
                {TOC.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-muted-strong transition hover:bg-black/5 hover:text-foreground"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Sections */}
          <div className="mt-8 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface lg:mt-0">

            <section id="acceptance" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">By accessing or using Invios ("the Service") at invios.online, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including visitors, registered users, and paying subscribers.</p>
            </section>

            <section id="description" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">Invios is a web-based invoicing and quotation platform designed for freelancers, solo operators, and small agencies. The Service allows users to create, manage, and share invoices, quotations, and client records. Features vary between the Free and Pro plans as described on our pricing page.</p>
            </section>

            <section id="registration" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">3. Account Registration</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">To access the Service you must create an account using a valid email address. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must be at least 18 years old to use the Service. You agree to provide accurate and complete information and to update it as necessary.</p>
            </section>

            <section id="plans" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">4. Free and Pro Plans</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">The Free plan allows up to 3 invoices, 3 quotations, and 2 clients at no cost. The Pro plan, billed at $15 per month, unlocks unlimited invoices, quotations, and clients, along with PDF/PNG export, recurring invoices, email reminders, analytics, and custom branding. Plan limits and features may be updated with reasonable notice.</p>
            </section>

            <section id="payment" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">5. Payment and Billing</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">Pro plan subscriptions are billed monthly at $15 through our payment processor, Creem. By subscribing, you authorise Creem to charge your payment method on a recurring monthly basis until you cancel. All prices are in US Dollars (USD) and are inclusive of any applicable taxes. Failed payments may result in suspension of Pro access until payment is resolved.</p>
            </section>

            <section id="cancellation" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">6. Cancellation</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">You may cancel your Pro subscription at any time through the customer portal. Upon cancellation, your Pro access remains active until the end of the current billing period. After that, your account reverts to the Free plan. Your data is retained and accessible in read-only mode on the Free plan.</p>
            </section>

            <section id="refund-policy" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">7. Refund Policy</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">We offer a 7-day refund on each monthly billing cycle. Please refer to our <Link href="/refund" className="text-accent underline underline-offset-4 hover:text-accent-strong">Refund Policy</Link> for full details and how to request a refund.</p>
            </section>

            <section id="acceptable-use" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">8. Acceptable Use</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">You agree to use the Service only for lawful purposes and in a manner that does not infringe the rights of others. Prohibited uses include: creating fraudulent invoices, impersonating another person or entity, attempting to gain unauthorised access to the Service, or using the Service in any way that could damage, disable, overburden, or impair it.</p>
            </section>

            <section id="intellectual-property" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">9. Intellectual Property</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">All content, trademarks, logos, and software associated with the Service are the property of Invios or its licensors. You retain ownership of your data — invoices, client information, and documents you create. You grant Invios a limited licence to store, process, and display your content solely to provide the Service.</p>
            </section>

            <section id="data-privacy" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">10. Data and Privacy</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">Our use of your personal information is governed by our <Link href="/privacy" className="text-accent underline underline-offset-4 hover:text-accent-strong">Privacy Policy</Link>, which is incorporated into these Terms by reference. We employ industry-standard security practices to protect your data.</p>
            </section>

            <section id="disclaimer" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">11. Disclaimer of Warranties</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses. We do not warrant the accuracy of any financial documents generated through the Service — you are responsible for verifying all output.</p>
            </section>

            <section id="liability" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">12. Limitation of Liability</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">To the maximum extent permitted by law, Invios shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues arising out of your use of the Service. Our total liability for any claim arising from your use of the Service shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
            </section>

            <section id="changes" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">13. Changes to Terms</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">We may update these Terms from time to time. We will notify you of material changes via email or a prominent notice on the Service. Continued use of the Service after changes become effective constitutes your acceptance of the revised Terms.</p>
            </section>

            <section id="governing-law" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">14. Governing Law</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">These Terms are governed by the laws of the United Arab Emirates. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of the UAE.</p>
            </section>

            <section id="contact" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">15. Contact</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">If you have any questions about these Terms, please contact us at <a href="mailto:legal@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">legal@invios.online</a>.</p>
            </section>

          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
