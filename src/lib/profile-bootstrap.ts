import type { SupabaseClient, User } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
};

const PROFILE_BOOTSTRAP_ERROR =
  "Workspace setup could not be completed. Please try again.";

type ProfileBootstrapUser = Pick<User, "id" | "email"> & {
  user_metadata?: {
    full_name?: unknown;
  };
};

function normalizeFullName(user: ProfileBootstrapUser) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName !== "string") {
    return null;
  }

  const trimmed = fullName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function selectProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(PROFILE_BOOTSTRAP_ERROR);
  }

  return data;
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: ProfileBootstrapUser,
) {
  const existingProfile = await selectProfile(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: normalizeFullName(user),
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(PROFILE_BOOTSTRAP_ERROR);
  }

  const bootstrappedProfile = await selectProfile(supabase, user.id);

  if (!bootstrappedProfile) {
    throw new Error(PROFILE_BOOTSTRAP_ERROR);
  }

  return bootstrappedProfile;
}

export { PROFILE_BOOTSTRAP_ERROR };
