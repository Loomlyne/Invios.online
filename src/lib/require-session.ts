import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/profile-bootstrap";

export async function requireSession() {
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

  const profile = await ensureUserProfile(supabase, user);

  return { supabase, user, profile };
}
