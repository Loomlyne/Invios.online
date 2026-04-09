import type { BrandingSection } from "@/lib/types";
import { BrandingWorkspace } from "@/components/app/branding-workspace";
import { getAppContext } from "@/lib/data";

const validSections = new Set<BrandingSection>(["identity", "business", "template", "documents"]);

export default async function BrandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const context = await getAppContext();
  const resolvedSearchParams = await searchParams;
  const section = resolvedSearchParams?.section;
  const initialSection = validSections.has(section as BrandingSection)
    ? (section as BrandingSection)
    : "identity";

  return <BrandingWorkspace context={context} initialSection={initialSection} />;
}
