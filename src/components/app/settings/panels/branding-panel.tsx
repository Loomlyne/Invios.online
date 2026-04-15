"use client";

import { startTransition, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { AppContext, ActionState, DocumentTemplateId } from "@/lib/types";
import { saveIdentityAction, saveTemplateAction } from "@/actions/app";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

const TEMPLATES: { id: DocumentTemplateId; label: string }[] = [
  { id: "classic", label: "Left Aligned" },
  { id: "executive", label: "Bold Header" },
  { id: "minimal", label: "Classic" },
];

const PAGE_BG_COLORS = [
  "#1E293B", "#E9D5FF", "#C4B5FD",
  "#BFDBFE", "#99F6E4", "#FECDD3",
  "#FED7AA", "#FEF08A", "#D9F99D",
];

export function BrandingPanel({ context }: { context: AppContext }) {
  const b = context.userState.branding;

  // Logo state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    context.previewData.logoUrl ?? null,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Colors
  const [primaryColor, setPrimaryColor] = useState(b.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(b.secondaryColor);

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateId>(
    context.userState.settings.documentTemplate,
  );

  // Page background
  const [pageBg, setPageBg] = useState<string>("#1E293B");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    logoFile !== null ||
    primaryColor !== b.primaryColor ||
    secondaryColor !== b.secondaryColor ||
    selectedTemplate !== context.userState.settings.documentTemplate;

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
        // Save identity (logo + colors) via FormData
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

        // Save template selection
        await saveTemplateAction({
          headingFont: b.headingFont ?? "DM Sans",
          bodyFont: b.bodyFont ?? "DM Sans",
          spacing: (b.spacing ?? "normal") as "compact" | "normal" | "spacious",
          headerLayout: (b.headerLayout ?? "left") as "left" | "center" | "right",
          lineItemsStyle: (b.lineItemsStyle ?? "table") as "table" | "cards" | "minimal",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted mt-1">Manage your account &amp; preferences</p>
        </div>
        <div className="hidden lg:block">
          <SaveButton isDirty={isDirty} onSave={handleSave} />
        </div>
      </div>

      {/* Invoice Branding */}
      <Section title="Invoice Branding" description="Customize your invoice look & feel">
        {/* Business Logo */}
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

        {/* Header Cover — placeholder for future */}
        <div>
          <p className="text-sm font-medium mb-2">Header Cover</p>
          <div className="border-2 border-dashed border-border rounded-[var(--radius-md)] p-8 flex flex-col items-center justify-center text-muted gap-2 hover:border-accent/40 transition cursor-pointer">
            <Upload className="size-5" />
            <p className="text-sm">Drop image or click to upload</p>
            <p className="text-xs">PNG, JPG. Max 2MB.</p>
          </div>
        </div>
      </Section>

      {/* Invoice Layout */}
      <Section title="Invoice Layout">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                "rounded-[var(--radius-md)] border-2 p-3 text-left transition",
                selectedTemplate === t.id
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40",
              )}
            >
              {/* Template preview card */}
              <div className="aspect-[3/4] rounded-[var(--radius-inner)] bg-white border border-border/50 mb-2 flex items-center justify-center">
                <span className="text-xs text-muted font-mono">{t.id}</span>
              </div>
              <p className="text-sm font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Invoice Colors */}
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

      {/* Page Background */}
      <Section title="Page Background" description="Background displayed behind the invoice on the editor page">
        <div className="space-y-3">
          {/* Tabs — only Color is functional */}
          <div className="flex rounded-full border border-border overflow-hidden text-sm">
            <button type="button" className="flex-1 py-2 bg-foreground text-white font-medium">Color</button>
            <button type="button" className="flex-1 py-2 text-muted cursor-not-allowed">Image</button>
            <button type="button" className="flex-1 py-2 text-muted cursor-not-allowed">Video</button>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
            {PAGE_BG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPageBg(color)}
                className={cn(
                  "aspect-square rounded-[var(--radius-md)] border-2 transition",
                  pageBg === color ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-border",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Mobile sticky save */}
      <div className="lg:hidden sticky bottom-20 z-10">
        <div className="bg-surface/80 backdrop-blur-sm border-t border-border px-4 py-3 -mx-4">
          <SaveButton isDirty={isDirty} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
