"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActionState,
  BrandingSettings,
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

export async function saveBrandingStepAction(formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSupabase();

    const primaryColor = String(formData.get("primaryColor") || "");
    const secondaryColor = String(formData.get("secondaryColor") || "");
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
          primary_color: primaryColor || null,
          secondary_color: secondaryColor || null,
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
