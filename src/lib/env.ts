export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Invios <onboarding@resend.dev>",
  cronSecret: process.env.CRON_SECRET ?? "",
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  paddleCheckoutUrl: process.env.PADDLE_CHECKOUT_URL ?? "",
  paddlePortalUrl: process.env.PADDLE_PORTAL_URL ?? "",
  paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
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

export function isCronAuthenticated(authHeader: string | null): boolean {
  return Boolean(env.cronSecret && authHeader === `Bearer ${env.cronSecret}`);
}
