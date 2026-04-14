import { createDefaultUserState } from "@/lib/preview";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve a branding asset path to a short-lived signed URL.
 * Returns null if path is missing or Supabase is not configured.
 */
export async function getPublicLogoUrl(logoPath: string | null | undefined): Promise<string | null> {
  if (!logoPath) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from("branding-assets")
    .createSignedUrl(logoPath, 60 * 10); // 10-minute TTL — sufficient for a page render

  if (error) return null;
  return data.signedUrl;
}

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
  signature_path: string | null;
  signature_mode: "none" | "upload" | "draw" | "typed" | null;
  signature_text: string | null;
  signature_font: string | null;
  invoice_prefix: string | null;
  quotation_prefix: string | null;
};

type SettingsRow = {
  default_currency: string | null;
  default_language: "en" | "ar" | "bilingual" | null;
  default_tax_rate: number | null;
  tax_enabled: boolean | null;
  default_notes: string | null;
  default_terms: string | null;
  timezone: string | null;
  document_template: "classic" | "executive" | "minimal" | null;
};

export async function getOwnerUserState(userId: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role key is missing.");
  }

  const [brandingResult, settingsResult] = await Promise.all([
    supabase
      .from("branding")
      .select(
        "business_name,business_email,phone,website,address,trn,bank_details,footer_text,primary_color,secondary_color,logo_path,signature_path,signature_mode,signature_text,signature_font,invoice_prefix,quotation_prefix",
      )
      .eq("user_id", userId)
      .maybeSingle<BrandingRow>(),
    supabase
      .from("user_settings")
      .select(
        "default_currency,default_language,default_tax_rate,tax_enabled,default_notes,default_terms,timezone,document_template",
      )
      .eq("user_id", userId)
      .maybeSingle<SettingsRow>(),
  ]);

  if (brandingResult.error) {
    throw new Error(brandingResult.error.message);
  }

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  const state = createDefaultUserState("");

  if (brandingResult.data) {
    state.profile.businessName = brandingResult.data.business_name ?? state.profile.businessName;
    state.profile.businessEmail = brandingResult.data.business_email ?? state.profile.businessEmail;
    state.profile.phone = brandingResult.data.phone ?? state.profile.phone;
    state.profile.website = brandingResult.data.website ?? state.profile.website;
    state.profile.address = brandingResult.data.address ?? state.profile.address;
    state.profile.trn = brandingResult.data.trn ?? state.profile.trn;
    state.profile.bankDetails = brandingResult.data.bank_details ?? state.profile.bankDetails;
    state.profile.footerText = brandingResult.data.footer_text ?? state.profile.footerText;
    state.branding.primaryColor = brandingResult.data.primary_color ?? state.branding.primaryColor;
    state.branding.secondaryColor = brandingResult.data.secondary_color ?? state.branding.secondaryColor;
    state.branding.logoPath = brandingResult.data.logo_path ?? null;
    state.branding.signaturePath = brandingResult.data.signature_path ?? null;
    state.branding.signatureMode = brandingResult.data.signature_mode ?? state.branding.signatureMode;
    state.branding.signatureText = brandingResult.data.signature_text ?? "";
    state.branding.signatureFont = brandingResult.data.signature_font ?? "Signature";
    state.settings.invoicePrefix = brandingResult.data.invoice_prefix ?? state.settings.invoicePrefix;
    state.settings.quotationPrefix = brandingResult.data.quotation_prefix ?? state.settings.quotationPrefix;
  }

  if (settingsResult.data) {
    state.settings.defaultCurrency = settingsResult.data.default_currency ?? state.settings.defaultCurrency;
    state.settings.defaultLanguage = settingsResult.data.default_language ?? state.settings.defaultLanguage;
    state.settings.defaultTaxRate = settingsResult.data.default_tax_rate ?? state.settings.defaultTaxRate;
    state.settings.taxEnabled = settingsResult.data.tax_enabled ?? state.settings.taxEnabled;
    state.settings.defaultNotes = settingsResult.data.default_notes ?? state.settings.defaultNotes;
    state.settings.defaultTerms = settingsResult.data.default_terms ?? state.settings.defaultTerms;
    state.settings.timezone = settingsResult.data.timezone ?? state.settings.timezone;
    state.settings.documentTemplate = settingsResult.data.document_template ?? state.settings.documentTemplate;
  }

  return state;
}
