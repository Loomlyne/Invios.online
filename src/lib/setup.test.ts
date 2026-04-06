import { describe, it, expect } from "vitest";
import { deriveSetupProgress } from "@/lib/setup";
import type { AppUserState, BusinessProfile, BrandingSettings, UserSettings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const baseProfile: BusinessProfile = {
  fullName: "",
  businessName: "",
  businessEmail: "",
  phone: "",
  website: "",
  address: "",
  trn: "",
  bankDetails: "",
  footerText: "",
};

const baseBranding: BrandingSettings = {
  primaryColor: "",
  secondaryColor: "",
  signatureMode: "none",
};

const baseSettings: UserSettings = {
  defaultCurrency: "AED",
  defaultLanguage: "en",
  defaultTaxRate: 5,
  taxEnabled: true,
  defaultTerms: "Payment due within 7 days.",
  defaultNotes: "Thank you for your business.",
  timezone: "Asia/Dubai",
  invoicePrefix: "INV",
  quotationPrefix: "QUO",
  documentTemplate: "classic",
};

function createUserState(overrides: Partial<AppUserState>): AppUserState {
  return {
    email: "test@invios.test",
    profile: baseProfile,
    branding: baseBranding,
    settings: baseSettings,
    onboardingStep: "business-profile",
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function findItem(progress: ReturnType<typeof deriveSetupProgress>, id: string) {
  return progress.items.find((item) => item.id === id);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deriveSetupProgress", () => {
  it("Test 1: brand-new user — all incomplete, zero progress", () => {
    const progress = deriveSetupProgress(createUserState({}));

    expect(progress.completedCount).toBe(0);
    expect(progress.totalCount).toBe(4);
    expect(progress.percentage).toBe(0);
    expect(progress.readyForCompletion).toBe(false);
    expect(progress.complete).toBe(false);

    expect(findItem(progress, "business-profile")?.complete).toBe(false);
    expect(findItem(progress, "branding")?.complete).toBe(false);
    expect(findItem(progress, "defaults")?.complete).toBe(false);
    expect(findItem(progress, "final-review")?.complete).toBe(false);
  });

  it("Test 2: user at branding step — business complete, others not", () => {
    const progress = deriveSetupProgress(
      createUserState({
        onboardingStep: "branding",
        profile: {
          ...baseProfile,
          fullName: "Jane Doe",
          businessName: "Jane Co",
          businessEmail: "jane@example.com",
          phone: "+971501234567",
          address: "Dubai, UAE",
        },
      }),
    );

    expect(findItem(progress, "business-profile")?.complete).toBe(true);
    expect(findItem(progress, "branding")?.complete).toBe(false);
    expect(findItem(progress, "defaults")?.complete).toBe(false);
    expect(progress.completedCount).toBe(1);
  });

  it("Test 3: user at defaults step — business + branding complete", () => {
    const progress = deriveSetupProgress(
      createUserState({ onboardingStep: "defaults" }),
    );

    expect(findItem(progress, "business-profile")?.complete).toBe(true);
    expect(findItem(progress, "branding")?.complete).toBe(true);
    expect(findItem(progress, "defaults")?.complete).toBe(false);
    expect(progress.completedCount).toBe(2);
  });

  it("Test 4: user at preview step — readyForCompletion=true, complete=false", () => {
    const progress = deriveSetupProgress(
      createUserState({ onboardingStep: "preview" }),
    );

    expect(findItem(progress, "business-profile")?.complete).toBe(true);
    expect(findItem(progress, "branding")?.complete).toBe(true);
    expect(findItem(progress, "defaults")?.complete).toBe(true);
    expect(findItem(progress, "final-review")?.complete).toBe(false);
    expect(progress.completedCount).toBe(3);
    expect(progress.readyForCompletion).toBe(true);
    expect(progress.complete).toBe(false);
  });

  it("Test 5: fully onboarded user — all complete, percentage=100, readyForCompletion=false", () => {
    const progress = deriveSetupProgress(
      createUserState({ onboardingCompletedAt: "2026-04-05T10:00:00Z" }),
    );

    expect(progress.completedCount).toBe(4);
    expect(progress.percentage).toBe(100);
    expect(progress.readyForCompletion).toBe(false);
    expect(progress.complete).toBe(true);

    expect(findItem(progress, "business-profile")?.complete).toBe(true);
    expect(findItem(progress, "branding")?.complete).toBe(true);
    expect(findItem(progress, "defaults")?.complete).toBe(true);
    expect(findItem(progress, "final-review")?.complete).toBe(true);
  });

  it("Test 6: user on business-profile step with all fields filled — business=true via OR condition", () => {
    const progress = deriveSetupProgress(
      createUserState({
        onboardingStep: "business-profile",
        profile: {
          ...baseProfile,
          fullName: "Ali Hassan",
          businessName: "Hassan Studio",
          businessEmail: "ali@hassan.studio",
          phone: "+971509876543",
          address: "Abu Dhabi, UAE",
        },
      }),
    );

    expect(findItem(progress, "business-profile")?.complete).toBe(true);
    expect(findItem(progress, "branding")?.complete).toBe(false);
  });

  it("Test 7: user with logo set — branding=true even on business-profile step", () => {
    const progress = deriveSetupProgress(
      createUserState({
        onboardingStep: "business-profile",
        branding: {
          ...baseBranding,
          logoPath: "/uploads/logo.png",
        },
      }),
    );

    expect(findItem(progress, "branding")?.complete).toBe(true);
  });
});
