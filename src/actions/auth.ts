"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { env, isSupabaseConfigured } from "@/lib/env";
import { ensureUserProfile } from "@/lib/profile-bootstrap";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

import {
  signInSchema,
  signUpSchema,
  emailSchema,
  updatePasswordSchema,
  changePasswordSchema,
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
    if (data.user) {
      await ensureUserProfile(supabase, data.user);
    }
    sendWelcomeEmail(parsed.data.email, parsed.data.fullName);
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

  const genericSuccess: ActionState = {
    status: "success",
    message: "Password reset instructions have been sent if the account exists.",
  };

  // Use admin client to generate the recovery link without sending Supabase's default email
  const admin = createSupabaseAdminClient();
  if (!admin) {
    // Fallback: use Supabase's built-in email if admin client is unavailable
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${env.siteUrl}/update-password`,
      });
    }
    return genericSuccess;
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: {
      redirectTo: `${env.siteUrl}/update-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    // Return generic success to prevent email enumeration
    return genericSuccess;
  }

  sendPasswordResetEmail(parsed.data.email, data.properties.action_link);
  return genericSuccess;
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

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client could not be created." };
  }

  // Get the current user's email to re-authenticate
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) {
    return { status: "error", message: "Could not verify your identity. Please sign in again." };
  }

  // Verify current password by attempting sign-in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { status: "error", message: "Current password is incorrect." };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return { status: "error", message: updateError.message };
  }

  if (userData.user.email) {
    sendPasswordChangedEmail(userData.user.email);
  }

  return { status: "success", message: "Password updated successfully." };
}

export async function deleteAccountAction(confirmation: string): Promise<ActionState> {
  if (confirmation !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm account deletion." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client could not be created." };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { status: "error", message: "Not authenticated." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { status: "error", message: "Admin access is not configured. Contact support." };
  }

  // Sign out first, then delete via admin client
  await supabase.auth.signOut();

  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) {
    return { status: "error", message: "Could not delete account. Please contact support." };
  }

  revalidatePath("/", "layout");
  return { status: "success", redirectTo: "/sign-in" };
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
