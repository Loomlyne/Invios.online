"use client";

import { startTransition, useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { AppContext } from "@/lib/types";
import { saveIdentityAction, saveTemplateAction } from "@/actions/app";
import { Section } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

/** Curated accent+background pairs. */
const THEME_PRESETS = [
  { name: "Gold", accent: "#CA8A04", bg: "#FFFFFF" },
  { name: "Midnight", accent: "#FBBF24", bg: "#0A0A0A" },
  { name: "Forest", accent: "#059669", bg: "#FFFFFF" },
  { name: "Ocean", accent: "#0284C7", bg: "#FFFFFF" },
  { name: "Crimson", accent: "#DC2626", bg: "#FFFFFF" },
  { name: "Violet", accent: "#7C3AED", bg: "#FFFFFF" },
  { name: "Stone", accent: "#44403C", bg: "#FFFFFF" },
  { name: "Slate Dark", accent: "#38BDF8", bg: "#1C1917" },
];

/** Pick readable foreground (dark/light) for a given background hex. */
function fgOnBg(bgHex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(bgHex.trim());
  if (!m) return "#17120F";
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#17120F" : "#F5F3F0";
}

/** Compact color row: label + swatch trigger + hex input, expands to full picker. */
function CompactColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-1.5">
          <span
            className="size-4 rounded-full border border-black/10"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-medium tabular-nums text-muted">{value.toUpperCase()}</span>
        </div>
      </div>
      <ColorPicker value={value} onChange={onChange} hidePreview />
    </div>
  );
}

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

      <Section title="Invoice Colors" description="Accent text + canvas background">
        {/* Live mini-preview — shows exactly how colors combine on the invoice */}
        <div
          className="mb-5 overflow-hidden rounded-[var(--radius-md)] border border-border"
          style={{ backgroundColor: secondaryColor }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-60" style={{ color: fgOnBg(secondaryColor) }}>Invoice</p>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>INV-0001</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-60" style={{ color: fgOnBg(secondaryColor) }}>Total due</p>
              <p className="text-lg font-semibold" style={{ color: primaryColor }}>AED 12,400</p>
            </div>
          </div>
          <div className="flex gap-1 px-5 pb-4">
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.9 }} />
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
          </div>
        </div>

        {/* Curated theme presets */}
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Themes</p>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((theme) => {
              const isActive =
                theme.accent.toLowerCase() === primaryColor.toLowerCase() &&
                theme.bg.toLowerCase() === secondaryColor.toLowerCase();
              return (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => { setPrimaryColor(theme.accent); setSecondaryColor(theme.bg); }}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 transition-all",
                    isActive
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-border hover:border-accent/40"
                  )}
                >
                  <span className="flex -space-x-1">
                    <span className="size-5 rounded-full border border-black/10" style={{ backgroundColor: theme.bg }} />
                    <span className="size-5 rounded-full border border-black/10" style={{ backgroundColor: theme.accent }} />
                  </span>
                  <span className="text-xs font-medium">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual color controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <CompactColorRow
            label="Accent (font)"
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <CompactColorRow
            label="Background"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
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
