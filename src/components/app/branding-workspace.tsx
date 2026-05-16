"use client";

import { startTransition, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Upload, X } from "lucide-react";
import {
  saveBusinessInfoAction,
  saveDocumentsAction,
  saveIdentityAction,
  saveTemplateAction,
  uploadCustomFontAction,
  deleteCustomFontAction,
} from "@/actions/app";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { SignaturePad } from "@/components/app/signature-pad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HEADING_FONTS, BODY_FONTS, SIGNATURE_FONTS } from "@/lib/constants";
import { buildInvoicePreviewData } from "@/lib/preview";
import type { AppContext, BrandingSection, CustomFont, SignatureMode } from "@/lib/types";

export function BrandingWorkspace({
  context,
  initialSection = "identity",
}: {
  context: AppContext;
  initialSection?: BrandingSection;
}) {
  const [branding, setBranding] = useState(context.userState.branding);
  const [profile, setProfile] = useState(context.userState.profile);
  const [settings, setSettings] = useState(context.userState.settings);
  const [activeTab, setActiveTab] = useState<BrandingSection>(initialSection);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>(
    context.userState.branding.signatureMode,
  );
  const [drawSignature, setDrawSignature] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    context.previewData.logoUrl ?? null,
  );
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    context.previewData.signatureUrl ?? null,
  );

  // Controlled for live preview
  const [primaryColor, setPrimaryColor] = useState(context.userState.branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(context.userState.branding.secondaryColor);
  const [spacing, setSpacing] = useState(context.userState.branding.spacing ?? "normal");
  const [headerLayout, setHeaderLayout] = useState(
    context.userState.branding.headerLayout ?? "left",
  );
  const [lineItemsStyle, setLineItemsStyle] = useState(
    context.userState.branding.lineItemsStyle ?? "table",
  );

  const [customFonts, setCustomFonts] = useState<CustomFont[]>(
    context.userState.branding.customFonts ?? [],
  );
  const [fontUploading, setFontUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const preview = buildInvoicePreviewData(
    {
      ...context.userState,
      profile,
      branding: {
        ...branding,
        primaryColor,
        secondaryColor,
        spacing,
        headerLayout,
        lineItemsStyle,
        signatureMode,
      },
      settings,
    },
    {
      logoUrl: logoPreviewUrl,
      signatureUrl:
        signatureMode === "upload" || signatureMode === "draw" ? signaturePreviewUrl : null,
      signatureMode,
      signatureText: branding.signatureText ?? "",
      signatureFont: branding.signatureFont ?? "Signature",
    },
  );

  const saveIdentity = async (formData: FormData) => {
    setSaving("identity");
    setMessage("");
    formData.set("signatureMode", signatureMode);
    formData.set("drawSignature", drawSignature);
    formData.set("keepLogoPath", branding.logoPath ?? "");
    formData.set("keepSignaturePath", branding.signaturePath ?? "");
    formData.set("keepFaviconPath", branding.faviconPath ?? "");
    const logoFile = logoInputRef.current?.files?.[0];
    const signatureFile = signatureInputRef.current?.files?.[0];
    const faviconFile = faviconInputRef.current?.files?.[0];
    if (logoFile) formData.set("logo", logoFile);
    if (signatureFile) formData.set("signatureFile", signatureFile);
    if (faviconFile) formData.set("favicon", faviconFile);

    startTransition(async () => {
      const result = await saveIdentityAction(formData);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setBranding((current) => ({
          ...current,
          primaryColor,
          secondaryColor,
          signatureMode,
          signatureText: String(formData.get("signatureText") || ""),
          signatureFont: String(formData.get("signatureFont") || "Signature"),
          baseFont: String(formData.get("baseFont") || "DM Sans"),
        }));
      }
    });
  };

  const saveBusiness = async (formData: FormData) => {
    setSaving("business");
    setMessage("");
    const values = {
      businessName: String(formData.get("businessName") || ""),
      businessEmail: String(formData.get("businessEmail") || ""),
      phone: String(formData.get("phone") || ""),
      website: String(formData.get("website") || ""),
      address: String(formData.get("address") || ""),
      trn: String(formData.get("trn") || ""),
      arabicBusinessName: String(formData.get("arabicBusinessName") || ""),
      arabicAddress: String(formData.get("arabicAddress") || ""),
      bankDetails: profile.bankDetails ?? "",
    };

    startTransition(async () => {
      const result = await saveBusinessInfoAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setProfile((current) => ({
          ...current,
          businessName: values.businessName,
          businessEmail: values.businessEmail,
          phone: values.phone,
          website: values.website,
          address: values.address,
          trn: values.trn,
        }));
        setBranding((current) => ({
          ...current,
          arabicBusinessName: values.arabicBusinessName,
          arabicAddress: values.arabicAddress,
        }));
      }
    });
  };

  const saveTemplate = async (formData: FormData) => {
    setSaving("template");
    setMessage("");
    const values = {
      headingFont: String(formData.get("headingFont") || "Playfair Display"),
      bodyFont: String(formData.get("bodyFont") || "Lato"),
      spacing: spacing as "compact" | "normal" | "spacious",
      headerLayout: headerLayout as "left" | "centered" | "split",
      lineItemsStyle: lineItemsStyle as "table" | "cards",
    };

    startTransition(async () => {
      const result = await saveTemplateAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setBranding((current) => ({
          ...current,
          headingFont: values.headingFont,
          bodyFont: values.bodyFont,
          spacing: values.spacing,
          headerLayout: values.headerLayout,
          lineItemsStyle: values.lineItemsStyle,
        }));
      }
    });
  };

  const saveDocuments = async (formData: FormData) => {
    setSaving("documents");
    setMessage("");
    const values = {
      invoicePrefix: String(formData.get("invoicePrefix") || ""),
      quotationPrefix: String(formData.get("quotationPrefix") || ""),
      bankDetails: String(formData.get("bankDetails") || ""),
      footerText: String(formData.get("footerText") || ""),
    };

    startTransition(async () => {
      const result = await saveDocumentsAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setProfile((current) => ({
          ...current,
          bankDetails: values.bankDetails,
          footerText: values.footerText,
        }));
        setSettings((current) => ({
          ...current,
          invoicePrefix: values.invoicePrefix,
          quotationPrefix: values.quotationPrefix,
        }));
      }
    });
  };

  const previewNode = <InvoicePreview preview={preview} />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-black/8 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="accent">Customize</Badge>
              <CardTitle className="mt-3">Branding</CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Customize your invoices and quotations.
              </CardDescription>
            </div>
            <div className="lg:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Preview</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">{previewNode}</DialogContent>
              </Dialog>
            </div>
          </div>
          {message ? (
            <div className="mt-4 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-muted-strong">
              {message}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BrandingSection)}>
            <TabsList>
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* ── Identity ─────────────────────────────────────── */}
            <TabsContent value="identity">
              <form action={saveIdentity} className="grid gap-6">
                <div className="grid gap-4 rounded-[1.4rem] border border-border bg-white p-5">
                  {/* Logo */}
                  <AssetRow
                    label="Company Logo"
                    hint="PNG or JPG, max 2MB"
                    preview={logoPreviewUrl}
                    onImageClick={() => logoInputRef.current?.click()}
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLogoPreviewUrl(URL.createObjectURL(file));
                      }}
                    />
                  </AssetRow>

                  {/* Signature */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <p className="text-sm font-medium">Signature</p>
                      <p className="text-sm text-muted">For invoices, max 1MB</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(["none", "upload", "draw", "typed"] as SignatureMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSignatureMode(mode)}
                          className={`cursor-pointer rounded-[1rem] border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                            signatureMode === mode
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-white hover:bg-surface"
                          }`}
                        >
                          {mode === "none" ? "Add later" : mode}
                        </button>
                      ))}
                    </div>
                    {signatureMode === "upload" ? (
                      <AssetRow
                        label="Signature image"
                        hint="PNG or JPG, max 1MB"
                        preview={signaturePreviewUrl}
                        onImageClick={() => signatureInputRef.current?.click()}
                      >
                        <input
                          ref={signatureInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSignaturePreviewUrl(URL.createObjectURL(file));
                          }}
                        />
                      </AssetRow>
                    ) : null}
                    {signatureMode === "draw" ? (
                      <SignaturePad
                        value={drawSignature}
                        onChange={(value) => {
                          setDrawSignature(value);
                          setSignaturePreviewUrl(value || null);
                        }}
                      />
                    ) : null}
                    {signatureMode === "typed" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Typed signature">
                          <Input name="signatureText" defaultValue={branding.signatureText ?? ""} />
                        </Field>
                        <Field label="Signature font">
                          <Select
                            name="signatureFont"
                            defaultValue={branding.signatureFont ?? "Signature"}
                            options={[
                              ...SIGNATURE_FONTS.map((f) => ({ value: f, label: f })),
                              ...customFonts.map((f) => ({ value: f.name, label: `${f.name} ✦` })),
                            ]}
                          />
                        </Field>
                      </div>
                    ) : null}
                  </div>

                  {/* Favicon */}
                  <div className="border-t border-border pt-4">
                    <AssetRow
                      label="Favicon / Icon"
                      hint="Used on portals and shared links, max 512KB"
                      preview={null}
                      onImageClick={() => faviconInputRef.current?.click()}
                    >
                      <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" />
                    </AssetRow>
                  </div>

                  {/* Colors */}
                  <div className="border-t border-border pt-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium">Brand Colors</p>
                      <p className="text-sm text-muted">
                        Choose colors that represent your brand on invoices and
                        quotations.
                      </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted">
                          Primary
                        </Label>
                        <ColorPicker
                          name="primaryColor"
                          value={primaryColor}
                          onChange={setPrimaryColor}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted">
                          Secondary
                        </Label>
                        <ColorPicker
                          name="secondaryColor"
                          value={secondaryColor}
                          onChange={setSecondaryColor}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Base Font */}
                  <div className="border-t border-border pt-4">
                    <Field label="Base Font">
                      <Select
                        name="baseFont"
                        defaultValue={branding.baseFont ?? "DM Sans"}
                        options={[
                          ...BODY_FONTS.map((f) => ({ value: f, label: f })),
                          ...customFonts.map((f) => ({ value: f.name, label: `${f.name} ✦` })),
                        ]}
                      />
                    </Field>
                  </div>

                  {/* Custom Fonts */}
                  <div className="border-t border-border pt-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium">Custom Fonts</p>
                      <p className="text-sm text-muted">Upload your brand fonts (.ttf, .otf, .woff2). They&apos;ll appear in all font pickers.</p>
                    </div>

                    {customFonts.length > 0 ? (
                      <div className="mb-3 space-y-2">
                        {customFonts.map((font) => (
                          <div
                            key={font.path}
                            className="flex items-center justify-between rounded-[0.8rem] border border-border bg-surface px-4 py-2.5"
                          >
                            <span className="text-sm font-medium text-foreground">{font.name}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await deleteCustomFontAction(font.path);
                                if (result.status === "success") {
                                  setCustomFonts((prev) => prev.filter((f) => f.path !== font.path));
                                }
                              }}
                              className="rounded-full p-1 text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <input
                      ref={fontInputRef}
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
                        const formData = new FormData();
                        formData.set("fontFile", file);
                        formData.set("fontName", name);
                        setFontUploading(true);
                        const result = await uploadCustomFontAction(formData);
                        setFontUploading(false);
                        if (result.status === "success" && result.font) {
                          setCustomFonts((prev) => [...prev, result.font!]);
                        }
                        setMessage(result.message ?? "");
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={fontUploading}
                      onClick={() => fontInputRef.current?.click()}
                    >
                      {fontUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Upload font
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full sm:w-fit"
                  disabled={saving === "identity"}
                >
                  {saving === "identity" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save identity
                </Button>
              </form>
            </TabsContent>

            {/* ── Business ──────────────────────────────────────── */}
            <TabsContent value="business">
              <form action={saveBusiness} className="grid gap-6">
                <div className="grid gap-4 rounded-[1.4rem] border border-border bg-white p-5">
                  <Field label="Business Name">
                    <Input name="businessName" defaultValue={profile.businessName} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email">
                      <Input name="businessEmail" type="email" defaultValue={profile.businessEmail} />
                    </Field>
                    <Field label="Phone">
                      <Input name="phone" defaultValue={profile.phone} />
                    </Field>
                  </div>
                  <Field label="Website">
                    <Input name="website" defaultValue={profile.website} />
                  </Field>
                  <Field label="Address">
                    <Textarea name="address" defaultValue={profile.address} />
                  </Field>
                  <Field label="TRN">
                    <Input name="trn" defaultValue={profile.trn} />
                  </Field>

                  <div className="border-t border-border pt-4">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
                      Arabic Translations
                    </p>
                    <div className="grid gap-4">
                      <Field label="Business Name (Arabic)">
                        <Input
                          name="arabicBusinessName"
                          dir="rtl"
                          defaultValue={branding.arabicBusinessName ?? ""}
                          placeholder="اسم الشركة"
                        />
                      </Field>
                      <Field label="Address (Arabic)">
                        <Textarea
                          name="arabicAddress"
                          dir="rtl"
                          defaultValue={branding.arabicAddress ?? ""}
                          placeholder="عنوان الشركة"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full sm:w-fit"
                  disabled={saving === "business"}
                >
                  {saving === "business" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save business info
                </Button>
              </form>
            </TabsContent>

            {/* ── Template ──────────────────────────────────────── */}
            <TabsContent value="template">
              <form action={saveTemplate} className="grid gap-6">
                <div className="grid gap-6 rounded-[1.4rem] border border-border bg-white p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Heading Font">
                      <Select
                        name="headingFont"
                        defaultValue={branding.headingFont ?? "Playfair Display"}
                        options={[
                          ...HEADING_FONTS.map((f) => ({ value: f, label: f })),
                          ...customFonts.map((f) => ({ value: f.name, label: `${f.name} ✦` })),
                        ]}
                      />
                    </Field>
                    <Field label="Body Font">
                      <Select
                        name="bodyFont"
                        defaultValue={branding.bodyFont ?? "Lato"}
                        options={[
                          ...BODY_FONTS.map((f) => ({ value: f, label: f })),
                          ...customFonts.map((f) => ({ value: f.name, label: `${f.name} ✦` })),
                        ]}
                      />
                    </Field>
                  </div>

                  <OptionGroup
                    label="Spacing"
                    options={["compact", "normal", "spacious"]}
                    value={spacing}
                    onChange={setSpacing}
                  />

                  <OptionGroup
                    label="Header Layout"
                    options={["left", "centered", "split"]}
                    value={headerLayout}
                    onChange={setHeaderLayout}
                  />

                  <OptionGroup
                    label="Line Items"
                    options={["table", "cards"]}
                    value={lineItemsStyle}
                    onChange={setLineItemsStyle}
                  />
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full sm:w-fit"
                  disabled={saving === "template"}
                >
                  {saving === "template" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save template
                </Button>
              </form>
            </TabsContent>

            {/* ── Documents ─────────────────────────────────────── */}
            <TabsContent value="documents">
              <form action={saveDocuments} className="grid gap-6">
                <div className="grid gap-4 rounded-[1.4rem] border border-border bg-white p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Invoice Prefix">
                      <Input name="invoicePrefix" defaultValue={settings.invoicePrefix} />
                    </Field>
                    <Field label="Quotation Prefix">
                      <Input name="quotationPrefix" defaultValue={settings.quotationPrefix} />
                    </Field>
                  </div>
                  <Field label="Bank / Payment Details">
                    <Textarea name="bankDetails" rows={4} defaultValue={profile.bankDetails} />
                  </Field>
                  <Field label="Footer Text">
                    <Input name="footerText" defaultValue={profile.footerText} />
                  </Field>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full sm:w-fit"
                  disabled={saving === "documents"}
                >
                  {saving === "documents" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save document settings
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Live Preview ─────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="sticky top-[7rem]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Live Preview
          </p>
          {previewNode}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AssetRow({
  label,
  hint,
  preview,
  onImageClick,
  children,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onImageClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={onImageClick}
        title="Click to upload"
        className="group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[0.8rem] border-2 border-dashed border-border bg-surface transition-colors hover:border-foreground/40"
      >
        {preview ? (
          <img src={preview} alt={label} className="size-full object-contain" />
        ) : (
          <span className="text-xs text-muted">PNG</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-[0.6rem] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[10px] font-semibold text-white">Upload</span>
        </div>
      </button>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
        {children}
      </div>
    </div>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`cursor-pointer rounded-[1rem] border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              value === option
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-white hover:bg-surface"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
