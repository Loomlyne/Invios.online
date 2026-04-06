import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return { supabase, user };
}
