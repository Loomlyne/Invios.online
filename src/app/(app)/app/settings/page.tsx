import { SETTINGS_SECTIONS, type SettingsSection } from "@/lib/types";
import { SettingsShell } from "@/components/app/settings/settings-shell";
import { getAppContext } from "@/lib/data";

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

  return <SettingsShell context={context} initialSection={initialSection} />;
}
