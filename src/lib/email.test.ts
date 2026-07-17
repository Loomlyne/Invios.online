import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Resend module — email.ts imports { Resend } and constructs it lazily.
// We capture the args passed to .emails.send so we can assert on composition.
const mockSend = vi.fn().mockResolvedValue({ id: "mock-email-id" });

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

// Force isEmailConfigured() to return true so getResend() instantiates the client.
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    isEmailConfigured: () => true,
    env: {
      ...actual.env,
      resendApiKey: "test-key",
      emailFrom: "Invios <onboarding@resend.dev>",
      siteUrl: "https://invios.test",
    },
  };
});

describe("email composition", () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it("sendReminderEmail includes invoice number in subject and publicUrl in body", async () => {
    const { sendReminderEmail } = await import("./email");
    sendReminderEmail({
      clientEmail: "client@example.com",
      clientName: "Acme Client",
      invoiceNumber: "INV-0042",
      amountDue: "AED 1,200.00",
      dueDate: "2026-08-01",
      publicUrl: "https://invios.test/invoices/public/token-abc",
      businessName: "Acme Studio",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];

    expect(args.to).toBe("client@example.com");
    expect(args.subject).toContain("INV-0042");
    expect(args.html).toContain("https://invios.test/invoices/public/token-abc");
    expect(args.html).toContain("INV-0042");
    expect(args.html).toContain("AED 1,200.00");
    expect(args.html).toContain("Acme Studio");
  });

  it("sendReminderEmail uses overdue subject when due date is in the past", async () => {
    const { sendReminderEmail } = await import("./email");
    sendReminderEmail({
      clientEmail: "client@example.com",
      clientName: "Acme Client",
      invoiceNumber: "INV-0099",
      amountDue: "AED 500.00",
      dueDate: "2020-01-01",
      publicUrl: "https://invios.test/invoices/public/old",
      businessName: "Acme Studio",
    });

    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("overdue");
    expect(args.html).toContain("Payment Overdue");
  });

  it("sendWelcomeEmail includes first name in body and sends to provided email", async () => {
    const { sendWelcomeEmail } = await import("./email");
    sendWelcomeEmail("newuser@example.com", "Jane Smith");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];

    expect(args.to).toBe("newuser@example.com");
    expect(args.subject).toBe("Welcome to Invios");
    expect(args.html).toContain("Hi Jane,");
    expect(args.html).toContain("workspace is ready");
  });

  it("sendPasswordResetEmail includes the reset link as CTA", async () => {
    const { sendPasswordResetEmail } = await import("./email");
    sendPasswordResetEmail("user@example.com", "https://invios.test/reset?token=xyz");

    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("Reset");
    expect(args.html).toContain("https://invios.test/reset?token=xyz");
    expect(args.html).toContain("Reset password");
  });

  it("sendPasswordChangedEmail sends confirmation", async () => {
    const { sendPasswordChangedEmail } = await import("./email");
    sendPasswordChangedEmail("user@example.com");

    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("password was changed");
    expect(args.html).toContain("Password updated");
  });

  it("sendSubscriptionActivatedEmail includes plan label and app link", async () => {
    const { sendSubscriptionActivatedEmail } = await import("./email");
    sendSubscriptionActivatedEmail("user@example.com", "annual");

    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("active");
    expect(args.html).toContain("Annual");
    expect(args.html).toContain("https://invios.test/app");
  });

  it("sendSubscriptionCanceledEmail includes access-until date", async () => {
    const { sendSubscriptionCanceledEmail } = await import("./email");
    sendSubscriptionCanceledEmail("user@example.com", "2026-12-31");

    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("canceled");
    expect(args.html).toContain("2026-12-31");
  });
});
