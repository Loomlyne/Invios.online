import { cache } from "react";
import { createDefaultUserState, buildInvoicePreviewData, getBrandingWarnings } from "@/lib/preview";
import { deriveSetupProgress } from "@/lib/setup";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppContext, AppUserState, BrandingSettings, BusinessProfile, UserSettings } from "@/lib/types";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  onboarding_step: AppUserState["onboardingStep"] | null;
  onboarding_completed_at: string | null;
};

type BrandingRow = {
  business_name: string | null;
  business_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  trn: string | null;
  bank_details: string | null;
  footer_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  logo_path: string | null;
  signature_mode: BrandingSettings["signatureMode"] | null;
  signature_path: string | null;
  signature_text: string | null;
  signature_font: string | null;
  invoice_prefix: string | null;
  quotation_prefix: string | null;
};

type SettingsRow = {
  default_currency: string | null;
  default_language: UserSettings["defaultLanguage"] | null;
  default_tax_rate: number | null;
  tax_enabled: boolean | null;
  default_terms: string | null;
  default_notes: string | null;
  timezone: string | null;
  document_template: UserSettings["documentTemplate"] | null;
};

async function createSignedAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("branding-assets")
    .createSignedUrl(path, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export const getAppContext = cache(async (): Promise<AppContext> => {
  const defaultState = createDefaultUserState();
  const defaultSetupProgress = deriveSetupProgress(defaultState);

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      userState: defaultState,
      previewData: buildInvoicePreviewData(defaultState),
      onboardingComplete: defaultSetupProgress.complete,
      onboardingRequired: !defaultSetupProgress.complete,
      setupProgress: defaultSetupProgress,
      warnings: ["Supabase environment variables are missing."],
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      userState: defaultState,
      previewData: buildInvoicePreviewData(defaultState),
      onboardingComplete: defaultSetupProgress.complete,
      onboardingRequired: !defaultSetupProgress.complete,
      setupProgress: defaultSetupProgress,
      warnings: ["Supabase client could not be created."],
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      userState: defaultState,
      previewData: buildInvoicePreviewData(defaultState),
      onboardingComplete: defaultSetupProgress.complete,
      onboardingRequired: !defaultSetupProgress.complete,
      setupProgress: defaultSetupProgress,
      warnings: [],
    };
  }

  const [profileResult, brandingResult, settingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,onboarding_step,onboarding_completed_at")
      .eq("id", user.id)
      .single<ProfileRow>(),
    supabase
      .from("branding")
      .select(
        "business_name,business_email,phone,website,address,trn,bank_details,footer_text,primary_color,secondary_color,logo_path,signature_mode,signature_path,signature_text,signature_font,invoice_prefix,quotation_prefix",
      )
      .eq("user_id", user.id)
      .maybeSingle<BrandingRow>(),
    supabase
      .from("user_settings")
      .select(
        "default_currency,default_language,default_tax_rate,tax_enabled,default_terms,default_notes,timezone,document_template",
      )
      .eq("user_id", user.id)
      .maybeSingle<SettingsRow>(),
  ]);

  const userState = createDefaultUserState(user.email ?? "");
  const warnings: string[] = [];

  if (profileResult.error) {
    warnings.push(profileResult.error.message);
  }

  if (brandingResult.error) {
    warnings.push(brandingResult.error.message);
  }

  if (settingsResult.error) {
    warnings.push(settingsResult.error.message);
  }

  if (profileResult.data) {
    userState.profile.fullName = profileResult.data.full_name ?? "";
    userState.email = profileResult.data.email ?? user.email ?? "";
    userState.onboardingStep =
      profileResult.data.onboarding_step ?? "business-profile";
    userState.onboardingCompletedAt = profileResult.data.onboarding_completed_at;
  } else {
    userState.profile.fullName =
      (user.user_metadata.full_name as string | undefined) ?? "";
    userState.email = user.email ?? "";
  }

  if (brandingResult.data) {
    userState.profile.businessName =
      brandingResult.data.business_name ?? userState.profile.businessName;
    userState.profile.businessEmail =
      brandingResult.data.business_email ?? userState.profile.businessEmail;
    userState.profile.phone =
      brandingResult.data.phone ?? userState.profile.phone;
    userState.profile.website =
      brandingResult.data.website ?? userState.profile.website;
    userState.profile.address =
      brandingResult.data.address ?? userState.profile.address;
    userState.profile.trn = brandingResult.data.trn ?? userState.profile.trn;
    userState.profile.bankDetails =
      brandingResult.data.bank_details ?? userState.profile.bankDetails;
    userState.profile.footerText =
      brandingResult.data.footer_text ?? userState.profile.footerText;
    userState.branding.primaryColor =
      brandingResult.data.primary_color ?? userState.branding.primaryColor;
    userState.branding.secondaryColor =
      brandingResult.data.secondary_color ?? userState.branding.secondaryColor;
    userState.branding.logoPath = brandingResult.data.logo_path;
    userState.branding.signatureMode =
      brandingResult.data.signature_mode ?? userState.branding.signatureMode;
    userState.branding.signaturePath = brandingResult.data.signature_path;
    userState.branding.signatureText = brandingResult.data.signature_text;
    userState.branding.signatureFont = brandingResult.data.signature_font;
    userState.settings.invoicePrefix =
      brandingResult.data.invoice_prefix ?? userState.settings.invoicePrefix;
    userState.settings.quotationPrefix =
      brandingResult.data.quotation_prefix ?? userState.settings.quotationPrefix;
  }

  if (settingsResult.data) {
    userState.settings.defaultCurrency =
      settingsResult.data.default_currency ?? userState.settings.defaultCurrency;
    userState.settings.defaultLanguage =
      settingsResult.data.default_language ?? userState.settings.defaultLanguage;
    userState.settings.defaultTaxRate =
      settingsResult.data.default_tax_rate ?? userState.settings.defaultTaxRate;
    userState.settings.taxEnabled =
      settingsResult.data.tax_enabled ?? userState.settings.taxEnabled;
    userState.settings.defaultTerms =
      settingsResult.data.default_terms ?? userState.settings.defaultTerms;
    userState.settings.defaultNotes =
      settingsResult.data.default_notes ?? userState.settings.defaultNotes;
    userState.settings.timezone =
      settingsResult.data.timezone ?? userState.settings.timezone;
    userState.settings.documentTemplate =
      settingsResult.data.document_template ?? userState.settings.documentTemplate;
  }

  const [logoUrl, signatureUrl] = await Promise.all([
    createSignedAssetUrl(userState.branding.logoPath),
    createSignedAssetUrl(userState.branding.signaturePath),
  ]);

  const previewData = buildInvoicePreviewData(userState, {
    logoUrl,
    signatureUrl,
  });
  const setupProgress = deriveSetupProgress(userState);

  return {
    configured: true,
    userId: user.id,
    email: user.email ?? "",
    userState,
    previewData,
    onboardingComplete: setupProgress.complete,
    onboardingRequired: !setupProgress.complete,
    setupProgress,
    warnings: [...new Set([...warnings, ...getBrandingWarnings(userState)])],
  };
});
