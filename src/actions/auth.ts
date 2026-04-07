"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

import {
  signInSchema,
  signUpSchema,
  emailSchema,
  updatePasswordSchema,
} from "@/lib/auth-schemas";

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Add your Supabase environment variables before signing in.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase client could not be created.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Add your Supabase environment variables before creating accounts.",
    };
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase client could not be created.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${env.siteUrl}/app`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (data.session) {
    revalidatePath("/app", "layout");
    redirect("/app");
  }

  return {
    status: "success",
    message: "Account created. Check your inbox to verify your email before signing in.",
  };
}

export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Add your Supabase environment variables before using password reset.",
    };
  }

  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase client could not be created.",
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/update-password`,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Password reset instructions have been sent if the account exists.",
  };
}

export async function updatePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Add your Supabase environment variables before updating passwords.",
    };
  }

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase client could not be created.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Password updated. You can return to the app now.",
  };
}

export async function signOutAction(): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    redirectTo: "/sign-in",
  };
}
