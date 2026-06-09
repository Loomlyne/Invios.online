import { permanentRedirect } from "next/navigation";

const LEGACY_SECTION_MAP: Record<string, string> = {
  identity: "branding",
  template: "branding",
  business: "business",
  documents: "general",
};

export default async function BrandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const resolved = await searchParams;
  const legacy = resolved?.section;
  const target =
    legacy && LEGACY_SECTION_MAP[legacy] ? LEGACY_SECTION_MAP[legacy] : "branding";

  permanentRedirect(`/app/settings?section=${target}`);
}
