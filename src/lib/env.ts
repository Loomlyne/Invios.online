export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Invios <onboarding@resend.dev>",
  cronSecret: process.env.CRON_SECRET ?? "",
  // Creem billing — https://docs.creem.io
  creemApiKey: process.env.CREEM_API_KEY ?? "",
  creemProductId: process.env.CREEM_PRODUCT_ID ?? "",
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET ?? "",
  // Operator/admin allowlist — comma-separated emails granted access to /admin.
  // Kept in env (not source) so the public repo never lists admin identities.
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function isEmailConfigured() {
  return Boolean(env.resendApiKey);
}

export function isCreemConfigured() {
  return Boolean(env.creemApiKey && env.creemProductId);
}

export function isCronAuthenticated(authHeader: string | null): boolean {
  return Boolean(env.cronSecret && authHeader === `Bearer ${env.cronSecret}`);
}

// True when the given email is on the operator/admin allowlist. Case-insensitive.
// Security comes from auth (the user must be signed in as this email); the
// allowlist only decides which authenticated accounts may reach /admin.
export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && env.adminEmails.includes(email.toLowerCase()));
}

export function isAdminConfigured(): boolean {
  return env.adminEmails.length > 0 && isSupabaseAdminConfigured();
}
