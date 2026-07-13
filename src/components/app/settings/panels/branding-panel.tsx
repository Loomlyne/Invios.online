"use client";

import { startTransition, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { AppContext } from "@/lib/types";
import { saveIdentityAction, saveTemplateAction } from "@/actions/app";
import { Section } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { ColorPicker } from "@/components/ui/color-picker";

export function BrandingPanel({ context }: { context: AppContext }) {
  const b = context.userState.branding;

  const logoInputRef = useRef<HTMLInputElement>(null);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    context.previewData.logoUrl ?? null,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [primaryColor, setPrimaryColor] = useState(b.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(b.secondaryColor);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    logoFile !== null ||
    primaryColor !== b.primaryColor ||
    secondaryColor !== b.secondaryColor;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("primaryColor", primaryColor);
        fd.set("secondaryColor", secondaryColor);
        fd.set("baseFont", b.baseFont ?? "DM Sans");
        fd.set("signatureMode", b.signatureMode);
        fd.set("signatureText", b.signatureText ?? "");
        fd.set("signatureFont", b.signatureFont ?? "Signature");
        fd.set("keepLogoPath", b.logoPath ?? "");
        fd.set("keepSignaturePath", b.signaturePath ?? "");
        fd.set("keepFaviconPath", b.faviconPath ?? "");
        if (logoFile) fd.set("logo", logoFile);

        const identityResult = await saveIdentityAction(fd);
        if (identityResult.status === "error") {
          setSaving(false);
          return;
        }

        await saveTemplateAction({
          headingFont: b.headingFont ?? "DM Sans",
          bodyFont: b.bodyFont ?? "DM Sans",
          spacing: (b.spacing ?? "normal") as "compact" | "normal" | "spacious",
          headerLayout: (b.headerLayout ?? "left") as "left" | "centered" | "split",
          lineItemsStyle: (b.lineItemsStyle ?? "table") as "table" | "cards",
        });

        setLogoFile(null);
        setSaved(true);
        setSaving(false);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaving(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted mt-1">Manage your account &amp; preferences</p>
        </div>
        <div className="hidden lg:block">
          <SaveButton isDirty={isDirty} onSave={handleSave} />
        </div>
      </div>

      <Section title="Invoice Branding" description="Customize your invoice look & feel">
        <div>
          <p className="text-sm font-medium mb-2">Business Logo</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="size-16 rounded-full border border-border bg-muted/10 flex items-center justify-center overflow-hidden hover:border-accent transition shrink-0"
            >
              {logoPreviewUrl ? (
                <img src={logoPreviewUrl} alt="Logo" className="size-full object-cover" />
              ) : (
                <Upload className="size-5 text-muted" />
              )}
            </button>
            <div className="text-sm text-muted">
              <p>PNG, JPG or SVG. Max 2MB.</p>
              <p>Appears on all invoices.</p>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </Section>

      <Section title="Invoice Colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Font</p>
            <div
              className="rounded-[var(--radius-md)] p-4 text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <p className="font-semibold">Font</p>
              <p className="text-xs opacity-80">{primaryColor.toUpperCase()}</p>
            </div>
            <div className="mt-2">
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Background</p>
            <div
              className="rounded-[var(--radius-md)] p-4 text-sm border border-border"
              style={{ backgroundColor: secondaryColor }}
            >
              <p className="font-semibold" style={{ color: primaryColor }}>Background</p>
              <p className="text-xs opacity-60">{secondaryColor.toUpperCase()}</p>
            </div>
            <div className="mt-2">
              <ColorPicker value={secondaryColor} onChange={setSecondaryColor} />
            </div>
          </div>
        </div>
      </Section>

      <div className="lg:hidden sticky bottom-20 z-10">
        <div className="bg-surface/80 backdrop-blur-sm border-t border-border px-4 py-3 -mx-4">
          <SaveButton isDirty={isDirty} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
