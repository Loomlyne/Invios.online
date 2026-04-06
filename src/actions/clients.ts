"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { clientFormSchema } from "@/lib/billing";
import { buildUniqueSlug } from "@/lib/billing-utils";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";

function parseClientForm(formData: FormData) {
  return clientFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    company: formData.get("company") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    status: formData.get("status") || "lead",
    trn: formData.get("trn") || "",
    taxCode: formData.get("taxCode") || "",
    logoPath: null,
  });
}

async function getExistingClientSlugs(
  userId: string,
  excludeId?: string,
) {
  const { supabase } = await requireSession();
  let query = supabase.from("clients").select("slug").eq("user_id", userId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => item.slug as string);
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseClientForm(formData);

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const { supabase, user } = await requireSession();
    const slugBase = parsed.data.company || parsed.data.name;
    const existingSlugs = await getExistingClientSlugs(user.id);
    const slug = buildUniqueSlug(slugBase, existingSlugs);

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        status: parsed.data.status,
        slug,
        trn: parsed.data.trn || null,
        tax_code: parsed.data.taxCode || null,
      })
      .select("slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/app/clients");
    redirect(`/app/clients/${data.slug}` as Route);
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create client.",
    };
  }
}

export async function updateClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseClientForm(formData);

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    if (!parsed.data.id) {
      return {
        status: "error",
        message: "Client id is required.",
      };
    }

    const { supabase, user } = await requireSession();
    const slugBase = parsed.data.company || parsed.data.name;
    const existingSlugs = await getExistingClientSlugs(user.id, parsed.data.id);
    const slug = buildUniqueSlug(slugBase, existingSlugs);

    const { data, error } = await supabase
      .from("clients")
      .update({
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        status: parsed.data.status,
        slug,
        trn: parsed.data.trn || null,
        tax_code: parsed.data.taxCode || null,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/app/clients");
    revalidatePath(`/app/clients/${data.slug}`);
    redirect(`/app/clients/${data.slug}` as Route);
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update client.",
    };
  }
}

export async function archiveClientAction(id: string) {
  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/clients");
  redirect("/app/clients");
}
