import type { SettingsSection } from "@/lib/types";
import { SettingsWorkspace } from "@/components/app/settings-workspace";
import { getAppContext } from "@/lib/data";

const validSections = new Set<SettingsSection>(["profile", "branding", "defaults"]);

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const context = await getAppContext();
  const resolvedSearchParams = await searchParams;
  const section = resolvedSearchParams?.section;
  const initialSection = validSections.has(section as SettingsSection)
    ? (section as SettingsSection)
    : "profile";

  return <SettingsWorkspace context={context} initialSection={initialSection} />;
}
