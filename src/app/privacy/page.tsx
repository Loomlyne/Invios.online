import Link from "next/link";
import type { Metadata } from "next";
import { InviosLogo } from "@/components/app/invios-logo";

export const metadata: Metadata = {
  title: "Privacy Policy — Invios",
};

export default function PrivacyPage() {
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
        <h1 className="display-text mt-4 text-4xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 17, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-strong">

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
            <p>Invios ("we", "us", or "our") operates the invoicing platform at invios.online. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our Service. We are committed to protecting your privacy and complying with applicable data protection laws, including UAE Federal Law No. 45 of 2021 on Personal Data Protection.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2>
            <p><strong>Account information:</strong> When you register, we collect your name, email address, and password hash.</p>
            <p><strong>Business information:</strong> Information you provide for invoicing, including business name, address, Tax Registration Number (TRN), bank details, logo, and branding assets.</p>
            <p><strong>Client data:</strong> Names, email addresses, and contact details of your clients that you enter into the platform.</p>
            <p><strong>Document data:</strong> Invoices, quotations, line items, and financial records you create through the Service.</p>
            <p><strong>Payment data:</strong> Billing and subscription information processed by our payment processor, Paddle. We do not store full card numbers — Paddle handles all sensitive payment data.</p>
            <p><strong>Usage data:</strong> Log data such as IP address, browser type, pages visited, and timestamps, collected automatically for security and performance purposes.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails (invoice reminders, password resets, billing notifications)</li>
              <li>Respond to support requests and communicate with you</li>
              <li>Monitor for fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not use your data for advertising purposes.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Data Storage and Security</h2>
            <p>Your data is stored on Supabase infrastructure, which uses PostgreSQL databases with row-level security. All data is encrypted in transit via TLS 1.2+ and at rest using AES-256 encryption. File assets (logos, signatures, documents) are stored in access-controlled cloud storage.</p>
            <p>We implement industry-standard security measures and conduct regular security reviews. However, no system is completely secure — we encourage you to use a strong, unique password for your account.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate Invios:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database, authentication, and file storage</li>
              <li><strong>Paddle</strong> — payment processing and subscription management</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — application hosting and deployment</li>
            </ul>
            <p>Each provider processes data in accordance with their own privacy policies and applicable data protection regulations. We only share the minimum information necessary for each provider to perform their function.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data via your account settings</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data from your account settings page. We will delete your data within 30 days, except where retention is required by law</li>
              <li><strong>Portability:</strong> Export your invoice and client data using the CSV export feature</li>
              <li><strong>Objection:</strong> Object to certain uses of your data by contacting us</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:privacy@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">privacy@invios.online</a>.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you delete your account, we will permanently delete your personal data within 30 days, except for data we are required to retain for legal or tax compliance purposes (typically up to 7 years for financial records under UAE law).</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. Cookies</h2>
            <p>We use strictly necessary cookies to maintain your session and authentication state. We do not use tracking cookies, third-party analytics cookies, or advertising cookies. You can control cookies through your browser settings, but disabling session cookies will prevent you from signing in.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">9. Children's Privacy</h2>
            <p>The Service is not directed at individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us and we will promptly delete it.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by email or by posting a notice on the Service. The date at the top of this policy reflects when it was last revised.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">11. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at <a href="mailto:privacy@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">privacy@invios.online</a>.</p>
          </div>

        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link>
          <Link href="/refund" className="underline underline-offset-4 hover:text-foreground">Refund Policy</Link>
          <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">Pricing</Link>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">Home</Link>
        </div>
      </section>
    </main>
  );
}
