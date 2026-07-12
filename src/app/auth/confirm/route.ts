import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";
import { ensureUserProfile } from "@/lib/profile-bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Handles every email-link auth flow (signup confirmation, password recovery,
// email change). Supabase emails link here with either:
//   ?token_hash=...&type=signup|recovery|email_change|email  (token-hash flow, preferred)
//   ?code=...                                                (PKCE flow fallback)
// On success the session cookies are set and the user is redirected to `next`.

const VALID_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

// Only allow relative redirect targets to prevent open-redirect abuse.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/app";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Redirect relative to the host the user actually hit (the canonical domain
  // once DNS points there), NOT env.siteUrl — a stale NEXT_PUBLIC_SITE_URL
  // would bounce the browser to a domain where the just-set session cookies
  // don't exist, making a successful confirmation look like a failed login.
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return redirectTo("/sign-in?error=config");
  }

  const type = VALID_OTP_TYPES.includes(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      if (data.user) {
        // Bootstrap the profile row now so the first /app render is instant.
        await ensureUserProfile(supabase, data.user).catch(() => {});

        if (type === "signup" && data.user.email) {
          const fullName =
            typeof data.user.user_metadata?.full_name === "string"
              ? data.user.user_metadata.full_name
              : "";
          sendWelcomeEmail(data.user.email, fullName);
        }
      }
      return redirectTo(next);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectTo(next);
    }
  }

  return redirectTo("/sign-in?error=confirmation_failed");
}
