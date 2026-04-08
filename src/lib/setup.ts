import { hasValue } from "@/lib/utils";
import type { AppUserState, SetupItemStatus, SetupProgress } from "@/lib/types";

function hasSavedBranding(userState: AppUserState) {
  if (userState.onboardingCompletedAt) {
    return true;
  }

  if (userState.onboardingStep === "defaults" || userState.onboardingStep === "preview") {
    return true;
  }

  return Boolean(
    userState.branding.logoPath ||
      userState.branding.signaturePath ||
      userState.branding.signatureMode !== "none",
  );
}

function hasSavedDefaults(userState: AppUserState) {
  return Boolean(
    userState.onboardingCompletedAt || userState.onboardingStep === "preview",
  );
}

export function deriveSetupProgress(userState: AppUserState): SetupProgress {
  const businessComplete =
    Boolean(userState.onboardingCompletedAt) ||
    userState.onboardingStep !== "business-profile" ||
    (hasValue(userState.profile.fullName) &&
      hasValue(userState.profile.businessName) &&
      hasValue(userState.profile.businessEmail) &&
      hasValue(userState.profile.phone) &&
      hasValue(userState.profile.address));

  const brandingComplete = hasSavedBranding(userState);
  const defaultsComplete = hasSavedDefaults(userState);
  const finalReviewComplete = Boolean(userState.onboardingCompletedAt);

  const items: SetupItemStatus[] = [
    {
      id: "business-profile",
      label: "Business profile",
      description: "Add the operator, company, billing email, phone, and address details.",
      href: "/app/branding?section=business" as unknown as import("next").Route,
      section: "business",
      complete: businessComplete,
    },
    {
      id: "branding",
      label: "Branding",
      description: "Set colors and upload a logo or signature so documents feel client-ready.",
      href: "/app/branding?section=identity" as unknown as import("next").Route,
      section: "identity",
      complete: brandingComplete,
    },
    {
      id: "defaults",
      label: "Defaults",
      description: "Lock currency, tax, prefixes, language, terms, notes, and timezone.",
      href: "/app/settings?section=general",
      section: "general",
      complete: defaultsComplete,
    },
    {
      id: "final-review",
      label: "Final review",
      description: "The app will mark setup complete automatically after the core settings are saved.",
      href: "/app",
      complete: finalReviewComplete,
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const readyForCompletion =
    businessComplete && brandingComplete && defaultsComplete && !finalReviewComplete;

  return {
    items,
    completedCount,
    totalCount: items.length,
    percentage: Math.round((completedCount / items.length) * 100),
    readyForCompletion,
    complete: finalReviewComplete,
  };
}
