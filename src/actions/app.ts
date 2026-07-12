"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActionState,
  BrandingSettings,
  CustomFont,
  OnboardingStep,
  SignatureMode,
} from "@/lib/types";

const businessProfileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  businessName: z.string().min(2, "Enter your business name."),
  businessEmail: z.string().email("Enter a valid business email."),
  phone: z.string().min(5, "Enter a phone number."),
  website: z.string().optional().transform((value) => value ?? ""),
  address: z.string().min(10, "Enter a business address."),
  trn: z.string().optional().transform((value) => value ?? ""),
  bankDetails: z.string().optional().transform((value) => value ?? ""),
  footerText: z.string().optional().transform((value) => value ?? ""),
});

const defaultsSchema = z.object({
  defaultCurrency: z.string().min(3, "Choose a currency."),
  defaultLanguage: z.enum(["en", "ar", "bilingual"]),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  taxEnabled: z.coerce.boolean(),
  defaultTerms: z.string().min(12, "Add default payment terms."),
  defaultNotes: z.string().min(12, "Add default notes."),
  timezone: z.string().min(3, "Choose a timezone."),
  invoicePrefix: z.string().min(2, "Add an invoice prefix."),
  quotationPrefix: z.string().min(2, "Add a quotation prefix."),
  documentTemplate: z.enum(["classic", "executive", "minimal"]),
});

async function requireSupabase() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be created.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be signed in.");
  }

  return { supabase, user };
}

async function uploadFileToStorage(userId: string, file: File, prefix: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const { supabase } = await requireSupabase();
  const extension = file.name.split(".").pop() || "bin";
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${userId}/${prefix}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("branding-assets")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

async function uploadDataUrlToStorage(
  userId: string,
  dataUrl: string,
  prefix: string,
) {
  if (!dataUrl.startsWith("data:")) {
    return null;
  }

  const { supabase } = await requireSupabase();
  const [meta, payload] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
  const extension = mime.split("/")[1] || "png";
  const buffer = Buffer.from(payload, "base64");
  const path = `${userId}/${prefix}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("branding-assets")
    .upload(path, buffer, {
      contentType: mime,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

async function updateOnboardingStep(step: OnboardingStep) {
  const { supabase, user } = await requireSupabase();

  await supabase
    .from("profiles")
    .update({ onboarding_step: step })
    .eq("id", user.id);
}

export async function saveBusinessProfileAction(
  input: z.infer<typeof businessProfileSchema>,
): Promise<ActionState> {
  try {
    const parsed = businessProfileSchema.safeParse(input);

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const { supabase, user } = await requireSupabase();

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? parsed.data.businessEmail,
          full_name: parsed.data.fullName,
          onboarding_step: "branding",
        },
        { onConflict: "id" },
      );

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: brandingError } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          business_name: parsed.data.businessName,
          business_email: parsed.data.businessEmail,
          phone: parsed.data.phone,
          website: parsed.data.website,
          address: parsed.data.address,
          trn: parsed.data.trn,
          bank_details: parsed.data.bankDetails,
          footer_text: parsed.data.footerText,
        },
        { onConflict: "user_id" },
      );

    if (brandingError) {
      throw new Error(brandingError.message);
    }

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return {
      status: "success",
      message: "Business profile saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save business profile.",
    };
  }
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function validateHexColor(value: string): string | null {
  const v = value.trim();
  return HEX_COLOR_RE.test(v) ? v : null;
}

export async function saveBrandingStepAction(formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const primaryColor = validateHexColor(String(formData.get("primaryColor") || ""));
    const secondaryColor = validateHexColor(String(formData.get("secondaryColor") || ""));
    const signatureMode = String(formData.get("signatureMode") || "none") as SignatureMode;
    const signatureText = String(formData.get("signatureText") || "");
    const signatureFont = String(formData.get("signatureFont") || "Signature");
    const drawSignature = String(formData.get("drawSignature") || "");
    const keepLogoPath = String(formData.get("keepLogoPath") || "");
    const keepSignaturePath = String(formData.get("keepSignaturePath") || "");
    const logoFile = formData.get("logo") as File | null;
    const signatureFile = formData.get("signatureFile") as File | null;

    const logoPath =
      logoFile && logoFile.size > 0
        ? await uploadFileToStorage(user.id, logoFile, "logo")
        : keepLogoPath || null;

    let signaturePath = keepSignaturePath || null;

    if (signatureMode === "upload" && signatureFile && signatureFile.size > 0) {
      signaturePath = await uploadFileToStorage(user.id, signatureFile, "signature");
    }

    if (signatureMode === "draw" && drawSignature) {
      signaturePath = await uploadDataUrlToStorage(user.id, drawSignature, "signature-draw");
    }

    const { error } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_path: logoPath,
          signature_mode: signatureMode,
          signature_path: signatureMode === "typed" || signatureMode === "none" ? null : signaturePath,
          signature_text: signatureMode === "typed" ? signatureText : null,
          signature_font: signatureMode === "typed" ? signatureFont : null,
        },
        { onConflict: "user_id" },
      );

    if (error) {
      throw new Error(error.message);
    }

    await updateOnboardingStep("defaults");

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return {
      status: "success",
      message: "Branding preferences saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save branding preferences.",
    };
  }
}

export async function saveDefaultsAction(
  input: z.infer<typeof defaultsSchema>,
): Promise<ActionState> {
  try {
    const parsed = defaultsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const { supabase, user } = await requireSupabase();

    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_currency: parsed.data.defaultCurrency,
          default_language: parsed.data.defaultLanguage,
          default_tax_rate: parsed.data.defaultTaxRate,
          tax_enabled: parsed.data.taxEnabled,
          default_terms: parsed.data.defaultTerms,
          default_notes: parsed.data.defaultNotes,
          timezone: parsed.data.timezone,
          document_template: parsed.data.documentTemplate,
        },
        { onConflict: "user_id" },
      );

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const { error: brandingError } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          invoice_prefix: parsed.data.invoicePrefix,
          quotation_prefix: parsed.data.quotationPrefix,
        },
        { onConflict: "user_id" },
      );

    if (brandingError) {
      throw new Error(brandingError.message);
    }

    await updateOnboardingStep("preview");

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return {
      status: "success",
      message: "Defaults saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save defaults.",
    };
  }
}

// ─── Settings page actions ───────────────────────────────────────────────────

const generalSettingsSchema = z.object({
  fullName: z.string().min(2, "Enter your name."),
  defaultCurrency: z.string().min(1, "Choose a currency."),
  defaultLanguage: z.enum(["en", "ar", "bilingual"]),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  taxEnabled: z.coerce.boolean(),
  timezone: z.string().min(1, "Choose a timezone."),
  dateFormat: z.string().min(1, "Choose a date format."),
});

const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Enter your name."),
  hourlyRate: z
    .union([z.coerce.number().min(0).max(999999), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
});

export async function saveGeneralSettingsAction(
  input: z.infer<typeof generalSettingsSchema>,
): Promise<ActionState> {
  try {
    const parsed = generalSettingsSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email ?? "", full_name: parsed.data.fullName }, { onConflict: "id" });

    if (profileError) throw new Error(profileError.message);

    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_currency: parsed.data.defaultCurrency,
          default_language: parsed.data.defaultLanguage,
          default_tax_rate: parsed.data.defaultTaxRate,
          tax_enabled: parsed.data.taxEnabled,
          timezone: parsed.data.timezone,
          date_format: parsed.data.dateFormat,
        },
        { onConflict: "user_id" },
      );

    if (settingsError) throw new Error(settingsError.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "General settings saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save general settings." };
  }
}

export async function saveProfileSettingsAction(
  input: z.infer<typeof profileSettingsSchema>,
): Promise<ActionState> {
  try {
    const parsed = profileSettingsSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: parsed.data.fullName,
          hourly_rate: parsed.data.hourlyRate,
        },
        { onConflict: "id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Profile saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save profile." };
  }
}

export async function saveInvoiceDefaultsAction(input: {
  defaultNotes: string;
  defaultTerms: string;
}): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, default_notes: input.defaultNotes, default_terms: input.defaultTerms },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Invoice defaults saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save invoice defaults." };
  }
}

const notificationsSchema = z.object({
  reminderEnabled: z.coerce.boolean(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(365),
  reminderDaysAfter: z.coerce.number().int().min(0).max(365),
  remindOnDueDate: z.coerce.boolean(),
  secondReminderDays: z.coerce.number().int().min(0).max(365),
  notifyQuoteAccepted: z.coerce.boolean(),
  notifyPaymentReceived: z.coerce.boolean(),
  notifyProjectActivity: z.coerce.boolean(),
  notifyChatFromCustomer: z.coerce.boolean(),
  notifyChatToCustomer: z.coerce.boolean(),
});

export async function saveNotificationsAction(
  input: z.infer<typeof notificationsSchema>,
): Promise<ActionState> {
  try {
    const parsed = notificationsSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          reminder_enabled: parsed.data.reminderEnabled,
          reminder_days_before: parsed.data.reminderDaysBefore,
          reminder_days_after: parsed.data.reminderDaysAfter,
          remind_on_due_date: parsed.data.remindOnDueDate,
          second_reminder_days: parsed.data.secondReminderDays,
          notify_quote_accepted: parsed.data.notifyQuoteAccepted,
          notify_payment_received: parsed.data.notifyPaymentReceived,
          notify_project_activity: parsed.data.notifyProjectActivity,
          notify_chat_from_customer: parsed.data.notifyChatFromCustomer,
          notify_chat_to_customer: parsed.data.notifyChatToCustomer,
        },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app/settings");
    return { status: "success", message: "Email preferences saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save notification preferences." };
  }
}

// ─── Branding page actions ────────────────────────────────────────────────────

export async function saveIdentityAction(formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const primaryColor = validateHexColor(String(formData.get("primaryColor") || ""));
    const secondaryColor = validateHexColor(String(formData.get("secondaryColor") || ""));
    const baseFont = String(formData.get("baseFont") || "DM Sans");
    const signatureMode = String(formData.get("signatureMode") || "none") as SignatureMode;
    const signatureText = String(formData.get("signatureText") || "");
    const signatureFont = String(formData.get("signatureFont") || "Signature");
    const drawSignature = String(formData.get("drawSignature") || "");
    const pageBackground = String(formData.get("pageBackground") || "");
    const keepLogoPath = String(formData.get("keepLogoPath") || "");
    const keepHeaderCoverPath = String(formData.get("keepHeaderCoverPath") || "");
    const keepSignaturePath = String(formData.get("keepSignaturePath") || "");
    const keepFaviconPath = String(formData.get("keepFaviconPath") || "");
    const logoFile = formData.get("logo") as File | null;
    const headerCoverFile = formData.get("headerCover") as File | null;
    const signatureFile = formData.get("signatureFile") as File | null;
    const faviconFile = formData.get("favicon") as File | null;

    const logoPath =
      logoFile && logoFile.size > 0
        ? await uploadFileToStorage(user.id, logoFile, "logo")
        : keepLogoPath || null;

    const headerCoverPath =
      headerCoverFile && headerCoverFile.size > 0
        ? await uploadFileToStorage(user.id, headerCoverFile, "header-cover")
        : keepHeaderCoverPath || null;

    const faviconPath =
      faviconFile && faviconFile.size > 0
        ? await uploadFileToStorage(user.id, faviconFile, "favicon")
        : keepFaviconPath || null;

    let signaturePath = keepSignaturePath || null;
    if (signatureMode === "upload" && signatureFile && signatureFile.size > 0) {
      signaturePath = await uploadFileToStorage(user.id, signatureFile, "signature");
    }
    if (signatureMode === "draw" && drawSignature) {
      signaturePath = await uploadDataUrlToStorage(user.id, drawSignature, "signature-draw");
    }

    const { error } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          page_background: pageBackground || null,
          logo_path: logoPath,
          header_cover_path: headerCoverPath,
          favicon_path: faviconPath,
          base_font: baseFont,
          signature_mode: signatureMode,
          signature_path: signatureMode === "typed" || signatureMode === "none" ? null : signaturePath,
          signature_text: signatureMode === "typed" ? signatureText : null,
          signature_font: signatureMode === "typed" ? signatureFont : null,
        },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Identity saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save identity." };
  }
}

const businessInfoSchema = z.object({
  businessName: z.string().min(2, "Enter your business name."),
  businessEmail: z.string().email("Enter a valid business email."),
  phone: z.string().min(5, "Enter a phone number."),
  website: z.string().optional().transform((v) => v ?? ""),
  address: z.string().min(5, "Enter a business address."),
  trn: z.string().optional().transform((v) => v ?? ""),
  arabicBusinessName: z.string().optional().transform((v) => v ?? ""),
  arabicAddress: z.string().optional().transform((v) => v ?? ""),
  bankDetails: z.string().optional().transform((v) => v ?? ""),
});

export async function saveBusinessInfoAction(
  input: z.infer<typeof businessInfoSchema>,
): Promise<ActionState> {
  try {
    const parsed = businessInfoSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          business_name: parsed.data.businessName,
          business_email: parsed.data.businessEmail,
          phone: parsed.data.phone,
          website: parsed.data.website,
          address: parsed.data.address,
          trn: parsed.data.trn,
          arabic_business_name: parsed.data.arabicBusinessName,
          arabic_address: parsed.data.arabicAddress,
          bank_details: parsed.data.bankDetails,
        },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Business info saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save business info." };
  }
}

const templateSchema = z.object({
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
  spacing: z.enum(["compact", "normal", "spacious"]),
  headerLayout: z.enum(["left", "centered", "split"]),
  lineItemsStyle: z.enum(["table", "cards"]),
  documentTemplate: z.enum(["classic", "executive", "minimal"]).optional(),
});

export async function saveTemplateAction(
  input: z.infer<typeof templateSchema>,
): Promise<ActionState> {
  try {
    const parsed = templateSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          heading_font: parsed.data.headingFont,
          body_font: parsed.data.bodyFont,
          spacing: parsed.data.spacing,
          header_layout: parsed.data.headerLayout,
          line_items_style: parsed.data.lineItemsStyle,
        },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    if (parsed.data.documentTemplate) {
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, document_template: parsed.data.documentTemplate },
          { onConflict: "user_id" },
        );

      if (settingsError) throw new Error(settingsError.message);
    }

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Template settings saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save template settings." };
  }
}

const documentsSchema = z.object({
  invoicePrefix: z.string().min(1, "Add an invoice prefix."),
  quotationPrefix: z.string().min(1, "Add a quotation prefix."),
  bankDetails: z.string().optional().transform((v) => v ?? ""),
  footerText: z.string().optional().transform((v) => v ?? ""),
});

export async function saveDocumentsAction(
  input: z.infer<typeof documentsSchema>,
): Promise<ActionState> {
  try {
    const parsed = documentsSchema.safeParse(input);

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("branding")
      .upsert(
        {
          user_id: user.id,
          invoice_prefix: parsed.data.invoicePrefix,
          quotation_prefix: parsed.data.quotationPrefix,
          bank_details: parsed.data.bankDetails,
          footer_text: parsed.data.footerText,
        },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Document settings saved." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save document settings." };
  }
}

export async function completeOnboardingAction(): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const [brandingResult, settingsResult] = await Promise.all([
      supabase
        .from("branding")
        .select("business_name,business_email,phone,address")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_settings")
        .select("default_currency,default_terms,default_notes,timezone")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!brandingResult.data?.business_name || !brandingResult.data.business_email) {
      return {
        status: "error",
        message: "Complete the business profile step first.",
      };
    }

    if (!settingsResult.data?.default_currency || !settingsResult.data.default_terms) {
      return {
        status: "error",
        message: "Complete the defaults step first.",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_step: "preview",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/app", "layout");
    revalidatePath("/app");
    revalidatePath("/app/settings");
    return {
      status: "success",
      message: "Setup completed.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not complete onboarding.",
    };
  }
}

export async function dismissSetupChecklistAction(): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const { error } = await supabase
      .from("profiles")
      .update({ setup_checklist_dismissed_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    return { status: "success", message: "Setup checklist dismissed." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not dismiss checklist.",
    };
  }
}

export async function uploadCustomFontAction(formData: FormData): Promise<ActionState & { font?: CustomFont }> {
  try {
    const { supabase, user } = await requireSupabase();
    const fontFile = formData.get("fontFile") as File | null;
    const fontName = String(formData.get("fontName") || "").trim();

    if (!fontFile || fontFile.size === 0) {
      return { status: "error", message: "No font file selected." };
    }

    if (!fontName) {
      return { status: "error", message: "Enter a name for the font." };
    }

    const ext = fontFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["ttf", "otf", "woff", "woff2"].includes(ext)) {
      return { status: "error", message: "Supported formats: .ttf, .otf, .woff, .woff2" };
    }

    if (fontFile.size > 5 * 1024 * 1024) {
      return { status: "error", message: "Font file must be under 5MB." };
    }

    const path = await uploadFileToStorage(user.id, fontFile, "font");
    if (!path) {
      return { status: "error", message: "Upload failed." };
    }

    // Get current custom fonts
    const { data: row } = await supabase
      .from("branding")
      .select("custom_fonts")
      .eq("user_id", user.id)
      .maybeSingle();

    const existing: CustomFont[] = (row?.custom_fonts as CustomFont[]) ?? [];
    const newFont: CustomFont = { name: fontName, path };
    const updated = [...existing, newFont];

    const { error } = await supabase
      .from("branding")
      .upsert({ user_id: user.id, custom_fonts: updated }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: `Font "${fontName}" uploaded.`, font: newFont };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not upload font." };
  }
}

export async function deleteCustomFontAction(fontPath: string): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    // Remove from storage
    await supabase.storage.from("branding-assets").remove([fontPath]);

    // Remove from custom_fonts array
    const { data: row } = await supabase
      .from("branding")
      .select("custom_fonts")
      .eq("user_id", user.id)
      .maybeSingle();

    const existing: CustomFont[] = (row?.custom_fonts as CustomFont[]) ?? [];
    const updated = existing.filter((f) => f.path !== fontPath);

    const { error } = await supabase
      .from("branding")
      .update({ custom_fonts: updated })
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    return { status: "success", message: "Font removed." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not remove font." };
  }
}
