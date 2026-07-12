import { SETTINGS_SECTIONS, type SettingsSection, type SubscriptionData } from "@/lib/types";
import { SettingsShell } from "@/components/app/settings/settings-shell";
import { getAppContext } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const validSections = new Set<SettingsSection>(SETTINGS_SECTIONS);

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const context = await getAppContext();
  const resolvedSearchParams = await searchParams;
  const section = resolvedSearchParams?.section;
  const initialSection: SettingsSection = validSections.has(section as SettingsSection)
    ? (section as SettingsSection)
    : "profile";

  // Fetch subscription server-side so BillingPanel can stay a pure display component
  let subscription: SubscriptionData = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("subscriptions")
          .select("status, current_period_end, plan")
          .eq("user_id", user.id)
          .maybeSingle<NonNullable<SubscriptionData>>();
        subscription = data ?? null;
      }
    }
  } catch {
    // Non-fatal — billing panel will show the free state
  }

  const portalUrl = "/api/creem/portal";

  return (
    <SettingsShell
      context={context}
      initialSection={initialSection}
      subscription={subscription}
      portalUrl={portalUrl}
    />
  );
}
