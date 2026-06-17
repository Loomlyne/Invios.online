import { Resend } from "resend";
import { env, isEmailConfigured } from "@/lib/env";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

// ---------------------------------------------------------------------------
// Branded HTML email template (table-based for email client compatibility)
// ---------------------------------------------------------------------------

function brandedEmailHtml({
  title,
  bodyLines,
  ctaUrl,
  ctaLabel,
  footnote,
}: {
  title: string;
  bodyLines: string[];
  ctaUrl?: string;
  ctaLabel?: string;
  footnote?: string;
}): string {
  const accent = "#ca8a04";
  const bg = "#f8f4ee";
  const surface = "#fffdf9";
  const fg = "#17120f";
  const muted = "#6b6359";
  const border = "rgba(28,25,23,0.12)";

  // SVG mark as data URI for email client compatibility (raw <svg> stripped by Gmail)
  const logoSrc =
    "data:image/svg+xml,%3Csvg viewBox='0 0 100 85.83' fill='%2317120f' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M75.51 16.28C71.04 6.67 61.3 0 50 0S28.95 6.67 24.48 16.28C10.67 18.07 0 29.87 0 44.17s10.53 25.95 24.22 27.85l-2.24 8.34c-.68 2.91.85 4.02 3.4 3.39l9.26-2.48A29.86 29.86 0 0050 85.83c10.23 0 19.18-5.46 24.1-13.63C88.59 71.07 100 58.95 100 44.17S89.33 18.06 75.51 16.28zM50 79.36a29.5 29.5 0 01-14.25-4.09l-2.25-2.07-1-1.2-.89-1.59C29.63 65.35 28.35 62.43 28.35 57.71c0-11.9 9.63-21.65 21.65-21.65 5.73 0 11.2 2.24 15.28 6.31a21.56 21.56 0 016.38 15.34c0 11.89-9.62 21.65-21.65 21.65z'/%3E%3Cpath d='M56.66 54.17v7.08c0 4.09 6.18 4.09 6.18 0v-7.08c0-4.06-6.18-4.06-6.18 0z'/%3E%3Cpath d='M37.16 54.17v7.08c0 4.09 6.18 4.09 6.18 0v-7.08c0-4.09-6.18-4.09-6.18 0z'/%3E%3Cpath d='M46.9 50.02v15.4c0 4.09 6.19 4.09 6.19 0v-15.4c0-4.09-6.19-4.09-6.19 0z'/%3E%3C/svg%3E";

  const bodyHtml = bodyLines
    .map((line) => `<p style="margin:0 0 14px;color:${muted};font-size:15px;line-height:1.65;">${line}</p>`)
    .join("");

  const ctaHtml = ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;width:100%;"><tr>
        <td style="background-color:${accent};border-radius:12px;text-align:center;">
          <a href="${ctaUrl}" target="_blank" style="display:block;padding:14px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${ctaLabel ?? "Continue"}</a>
        </td>
      </tr></table>
      <p style="margin:8px 0 0;font-size:12px;color:${muted};">Or copy this link: <span style="color:${accent};word-break:break-all;">${ctaUrl}</span></p>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:18px 0 0;color:${muted};font-size:13px;line-height:1.5;">${footnote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <img src="${logoSrc}" alt="Invios" width="32" height="28" style="display:block;" />
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:22px;font-weight:600;color:${fg};letter-spacing:-0.03em;">Invios</span>
                </td>
              </tr></table>
            </td>
          </tr>
          <!-- Accent line -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="height:2px;background-color:${accent};border-radius:1px;"></div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${surface};border:1px solid ${border};border-radius:16px;padding:32px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:16px;">
                  <h1 style="margin:0;font-size:20px;font-weight:600;color:${fg};letter-spacing:-0.02em;">${title}</h1>
                </td></tr>
                <tr><td>${bodyHtml}${ctaHtml}${footnoteHtml}</td></tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:${muted};">
                Invios &mdash; <a href="https://invios.online" style="color:${accent};text-decoration:none;">invios.online</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Sender functions (fire-and-forget — errors logged, never thrown)
// ---------------------------------------------------------------------------

export function sendWelcomeEmail(email: string, fullName: string): void {
  const client = getResend();
  if (!client) return;

  const firstName = fullName.split(" ")[0] || fullName;

  client.emails
    .send({
      from: env.emailFrom,
      to: email,
      subject: "Welcome to Invios",
      html: brandedEmailHtml({
        title: "Welcome to Invios",
        bodyLines: [
          `Hi ${firstName},`,
          "Your Invios workspace is ready. Start creating branded invoices, quotations, and managing clients right away.",
        ],
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send welcome email:", err));
}

export function sendPasswordResetEmail(email: string, actionLink: string): void {
  const client = getResend();
  if (!client) return;

  client.emails
    .send({
      from: env.emailFrom,
      to: email,
      subject: "Reset your Invios password",
      html: brandedEmailHtml({
        title: "Reset your password",
        bodyLines: [
          "We received a request to reset the password for your Invios account.",
          "Click the button below to choose a new password. This link expires in 24 hours.",
        ],
        ctaUrl: actionLink,
        ctaLabel: "Reset password",
        footnote: "If you didn\u2019t request this, you can safely ignore this email.",
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send password reset email:", err));
}

export function sendPasswordChangedEmail(email: string): void {
  const client = getResend();
  if (!client) return;

  client.emails
    .send({
      from: env.emailFrom,
      to: email,
      subject: "Your Invios password was changed",
      html: brandedEmailHtml({
        title: "Password updated",
        bodyLines: [
          "The password for your Invios account was just changed.",
          "If you made this change, no further action is needed.",
          "If you didn\u2019t make this change, reset your password immediately from the sign-in page.",
        ],
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send password changed email:", err));
}

/**
 * Send a payment reminder email to a client.
 * Content: invoice public link + amount due + due date (per D-16).
 * Sent to the client's email address (per D-17).
 */
export function sendReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate: string;
  publicUrl: string;
  businessName: string;
}): void {
  const client = getResend();
  if (!client) return;

  const firstName = params.clientName.split(" ")[0] || params.clientName;
  const isOverdue = new Date(params.dueDate) < new Date();
  const subject = isOverdue
    ? `Payment overdue: Invoice ${params.invoiceNumber}`
    : `Payment reminder: Invoice ${params.invoiceNumber}`;

  client.emails
    .send({
      from: env.emailFrom,
      to: params.clientEmail,
      subject,
      html: brandedEmailHtml({
        title: isOverdue ? "Payment Overdue" : "Payment Reminder",
        bodyLines: [
          `Hi ${firstName},`,
          isOverdue
            ? `This is a reminder that Invoice ${params.invoiceNumber} for ${params.amountDue} was due on ${params.dueDate} and is now overdue.`
            : `This is a friendly reminder that Invoice ${params.invoiceNumber} for ${params.amountDue} is due on ${params.dueDate}.`,
          "Please review the invoice and arrange payment at your earliest convenience.",
        ],
        ctaUrl: params.publicUrl,
        ctaLabel: "View Invoice",
        footnote: `Sent on behalf of ${params.businessName} via Invios.`,
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send reminder email:", err));
}

export function sendSubscriptionActivatedEmail(email: string, plan: string): void {
  const client = getResend();
  if (!client) return;

  const planLabel = plan === "annual" ? "Annual" : "Monthly";

  client.emails
    .send({
      from: env.emailFrom,
      to: email,
      subject: "Your Invios Pro access is now active",
      html: brandedEmailHtml({
        title: "Welcome to Invios Pro",
        bodyLines: [
          "Your subscription is now active and your workspace is fully unlocked.",
          `Plan: Invios Pro (${planLabel})`,
          "You can find your access key and manage your subscription in Settings → Billing.",
        ],
        ctaUrl: `${env.siteUrl}/app`,
        ctaLabel: "Open Invios",
        footnote: "Thank you for subscribing to Invios.",
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send subscription activated email:", err));
}

export function sendSubscriptionCanceledEmail(email: string, accessUntil: string): void {
  const client = getResend();
  if (!client) return;

  client.emails
    .send({
      from: env.emailFrom,
      to: email,
      subject: "Your Invios subscription has been canceled",
      html: brandedEmailHtml({
        title: "Subscription canceled",
        bodyLines: [
          "Your Invios Pro subscription has been canceled.",
          `You will retain full access to your workspace until ${accessUntil}.`,
          "After that date, your account will revert to read-only mode. You can resubscribe at any time.",
        ],
        ctaUrl: `${env.siteUrl}/pricing`,
        ctaLabel: "Resubscribe",
        footnote: "We're sorry to see you go. Your data is safe and will be here if you return.",
      }),
    })
    .catch((err: unknown) => console.error("[email] Failed to send subscription canceled email:", err));
}
