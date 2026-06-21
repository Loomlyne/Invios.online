export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Invios",
};

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "what-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "storage-security", label: "Data Storage and Security" },
  { id: "third-parties", label: "Third-Party Services" },
  { id: "your-rights", label: "Your Rights" },
  { id: "retention", label: "Data Retention" },
  { id: "cookies", label: "Cookies" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <PublicNav cta="pricing" />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <Badge variant="accent">Legal</Badge>
          <h1 className="display-text mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: June 17, 2026</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-strong">
            We are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
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

            <section id="introduction" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">Invios ("we", "us", or "our") operates the invoicing platform at invios.online. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our Service. We are committed to protecting your privacy and complying with applicable data protection laws, including UAE Federal Law No. 45 of 2021 on Personal Data Protection.</p>
            </section>

            <section id="what-we-collect" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                <p><strong className="text-foreground">Account information:</strong> When you register, we collect your name, email address, and password hash.</p>
                <p><strong className="text-foreground">Business information:</strong> Information you provide for invoicing, including business name, address, Tax Registration Number (TRN), bank details, logo, and branding assets.</p>
                <p><strong className="text-foreground">Client data:</strong> Names, email addresses, and contact details of your clients that you enter into the platform.</p>
                <p><strong className="text-foreground">Document data:</strong> Invoices, quotations, line items, and financial records you create through the Service.</p>
                <p><strong className="text-foreground">Payment data:</strong> Billing and subscription information processed by our payment processor, Creem. We do not store full card numbers — Creem handles all sensitive payment data.</p>
                <p><strong className="text-foreground">Usage data:</strong> Log data such as IP address, browser type, pages visited, and timestamps, collected automatically for security and performance purposes.</p>
              </div>
            </section>

            <section id="how-we-use" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">3. How We Use Your Information</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                <p>We use your information to:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Process payments and manage your subscription</li>
                  <li>Send transactional emails (invoice reminders, password resets, billing notifications)</li>
                  <li>Respond to support requests and communicate with you</li>
                  <li>Monitor for fraud and ensure platform security</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <p>We do not sell your personal information to third parties. We do not use your data for advertising purposes.</p>
              </div>
            </section>

            <section id="storage-security" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">4. Data Storage and Security</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                <p>Your data is stored on Supabase infrastructure, which uses PostgreSQL databases with row-level security. All data is encrypted in transit via TLS 1.2+ and at rest using AES-256 encryption. File assets (logos, signatures, documents) are stored in access-controlled cloud storage.</p>
                <p>We implement industry-standard security measures and conduct regular security reviews. However, no system is completely secure — we encourage you to use a strong, unique password for your account.</p>
              </div>
            </section>

            <section id="third-parties" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">5. Third-Party Services</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                <p>We use the following third-party services to operate Invios:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li><strong className="text-foreground">Supabase</strong> — database, authentication, and file storage</li>
                  <li><strong className="text-foreground">Creem</strong> — payment processing and subscription management</li>
                  <li><strong className="text-foreground">Resend</strong> — transactional email delivery</li>
                  <li><strong className="text-foreground">Vercel</strong> — application hosting and deployment</li>
                </ul>
                <p>Each provider processes data in accordance with their own privacy policies and applicable data protection regulations. We only share the minimum information necessary for each provider to perform their function.</p>
              </div>
            </section>

            <section id="your-rights" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                <p>You have the following rights regarding your personal data:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate data via your account settings</li>
                  <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated data from your account settings page. We will delete your data within 30 days, except where retention is required by law</li>
                  <li><strong className="text-foreground">Portability:</strong> Export your invoice and client data using the CSV export feature</li>
                  <li><strong className="text-foreground">Objection:</strong> Object to certain uses of your data by contacting us</li>
                </ul>
                <p>To exercise any of these rights, contact us at <a href="mailto:privacy@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">privacy@invios.online</a>.</p>
              </div>
            </section>

            <section id="retention" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">7. Data Retention</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">We retain your account data for as long as your account is active. If you delete your account, we will permanently delete your personal data within 30 days, except for data we are required to retain for legal or tax compliance purposes (typically up to 7 years for financial records under UAE law).</p>
            </section>

            <section id="cookies" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">8. Cookies</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">We use strictly necessary cookies to maintain your session and authentication state. We do not use tracking cookies, third-party analytics cookies, or advertising cookies. You can control cookies through your browser settings, but disabling session cookies will prevent you from signing in.</p>
            </section>

            <section id="children" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">9. Children's Privacy</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">The Service is not directed at individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us and we will promptly delete it.</p>
            </section>

            <section id="changes" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">10. Changes to This Policy</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on the Service. The date at the top of this policy reflects when it was last revised.</p>
            </section>

            <section id="contact" className="p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">11. Contact Us</h2>
              <p className="mt-3 text-sm leading-7 text-muted-strong">If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at <a href="mailto:privacy@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">privacy@invios.online</a>.</p>
            </section>

          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
