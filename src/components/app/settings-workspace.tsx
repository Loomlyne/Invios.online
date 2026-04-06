"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import type { ReactNode } from "react";
import { Loader2, Palette, Settings2, UserRoundCheck } from "lucide-react";
import { saveBrandingStepAction, saveBusinessProfileAction, saveDefaultsAction } from "@/actions/app";
import { DocumentTemplatePicker } from "@/components/documents/document-template-picker";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { SignaturePad } from "@/components/app/signature-pad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { buildInvoicePreviewData } from "@/lib/preview";
import type { AppContext, SettingsSection, SignatureMode } from "@/lib/types";

export function SettingsWorkspace({
  context,
  initialSection = "profile",
}: {
  context: AppContext;
  initialSection?: SettingsSection;
}) {
  const [profile, setProfile] = useState(context.userState.profile);
  const [branding, setBranding] = useState(context.userState.branding);
  const [settings, setSettings] = useState(context.userState.settings);
  const [activeTab, setActiveTab] = useState<SettingsSection>(initialSection);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>(
    context.userState.branding.signatureMode,
  );
  const [drawSignature, setDrawSignature] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(context.previewData.logoUrl ?? null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    context.previewData.signatureUrl ?? null,
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const preview = buildInvoicePreviewData(
    {
      ...context.userState,
      profile,
      branding: {
        ...branding,
        signatureMode,
      },
      settings,
    },
    {
      logoUrl: logoPreviewUrl,
      signatureUrl: signatureMode === "upload" || signatureMode === "draw" ? signaturePreviewUrl : null,
      signatureMode,
      signatureText: branding.signatureText ?? "",
      signatureFont: branding.signatureFont ?? "Signature",
    },
  );

  const saveProfile = async (formData: FormData) => {
    setSaving("profile");
    setMessage("");
    const values = {
      fullName: String(formData.get("fullName") || ""),
      businessName: String(formData.get("businessName") || ""),
      businessEmail: String(formData.get("businessEmail") || ""),
      phone: String(formData.get("phone") || ""),
      website: String(formData.get("website") || ""),
      address: String(formData.get("address") || ""),
      trn: String(formData.get("trn") || ""),
      bankDetails: String(formData.get("bankDetails") || ""),
      footerText: String(formData.get("footerText") || ""),
    };

    startTransition(async () => {
      const result = await saveBusinessProfileAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setProfile(values);
      }
    });
  };

  const saveBranding = async (formData: FormData) => {
    setSaving("branding");
    setMessage("");
    formData.set("signatureMode", signatureMode);
    formData.set("drawSignature", drawSignature);
    formData.set("keepLogoPath", branding.logoPath ?? "");
    formData.set("keepSignaturePath", branding.signaturePath ?? "");
    const logoFile = logoInputRef.current?.files?.[0];
    const signatureFile = signatureInputRef.current?.files?.[0];
    if (logoFile) formData.set("logo", logoFile);
    if (signatureFile) formData.set("signatureFile", signatureFile);

    startTransition(async () => {
      const result = await saveBrandingStepAction(formData);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setBranding((current) => ({
          ...current,
          primaryColor: String(formData.get("primaryColor") || ""),
          secondaryColor: String(formData.get("secondaryColor") || ""),
          signatureMode,
          signatureText: String(formData.get("signatureText") || ""),
          signatureFont: String(formData.get("signatureFont") || "Signature"),
        }));
      }
    });
  };

  const saveDefaults = async (formData: FormData) => {
    setSaving("defaults");
    setMessage("");
    const values = {
      defaultCurrency: String(formData.get("defaultCurrency") || ""),
      defaultLanguage: String(formData.get("defaultLanguage") || "en") as "en" | "ar" | "bilingual",
      defaultTaxRate: Number(formData.get("defaultTaxRate") || 0),
      taxEnabled: formData.get("taxEnabled") === "on",
      defaultTerms: String(formData.get("defaultTerms") || ""),
      defaultNotes: String(formData.get("defaultNotes") || ""),
      timezone: String(formData.get("timezone") || ""),
      invoicePrefix: String(formData.get("invoicePrefix") || ""),
      quotationPrefix: String(formData.get("quotationPrefix") || ""),
      documentTemplate: String(formData.get("documentTemplate") || "classic") as "classic" | "executive" | "minimal",
    };

    startTransition(async () => {
      const result = await saveDefaultsAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setSettings(values);
      }
    });
  };

  const previewNode = <InvoicePreview preview={preview} />;

  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-black/8 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="accent">Settings foundation</Badge>
              <CardTitle className="mt-3">Business, branding, and defaults</CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Keep the business profile, visual identity, document template, and billing defaults aligned across preview, public links, and PDF export.
              </CardDescription>
            </div>
            <div className="xl:hidden">
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsSection)}>
            <TabsList>
              <TabsTrigger value="profile">
                <UserRoundCheck className="mr-2 size-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="branding">
                <Palette className="mr-2 size-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="defaults">
                <Settings2 className="mr-2 size-4" />
                Defaults
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <form action={saveProfile} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name"><Input name="fullName" defaultValue={profile.fullName} /></Field>
                  <Field label="Business name"><Input name="businessName" defaultValue={profile.businessName} /></Field>
                  <Field label="Business email"><Input name="businessEmail" type="email" defaultValue={profile.businessEmail} /></Field>
                  <Field label="Phone"><Input name="phone" defaultValue={profile.phone} /></Field>
                </div>
                <Field label="Website"><Input name="website" defaultValue={profile.website} /></Field>
                <Field label="Address"><Textarea name="address" defaultValue={profile.address} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="TRN"><Input name="trn" defaultValue={profile.trn} /></Field>
                  <Field label="Footer text"><Input name="footerText" defaultValue={profile.footerText} /></Field>
                </div>
                <Field label="Bank details"><Textarea name="bankDetails" defaultValue={profile.bankDetails} /></Field>
                <Button type="submit" variant="accent" className="w-full sm:w-fit" disabled={saving === "profile"}>
                  {saving === "profile" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save profile
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="branding">
              <form action={saveBranding} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary color">
                    <Input name="primaryColor" type="color" className="h-14 p-2" defaultValue={branding.primaryColor} />
                  </Field>
                  <Field label="Secondary color">
                    <Input name="secondaryColor" type="color" className="h-14 p-2" defaultValue={branding.secondaryColor} />
                  </Field>
                </div>
                <Field label="Logo upload">
                  <Input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setLogoPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </Field>

                <div className="space-y-3">
                  <Label>Signature mode</Label>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {(["none", "upload", "draw", "typed"] as SignatureMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSignatureMode(mode)}
                        className={`rounded-[1rem] border px-4 py-3 text-sm font-medium capitalize ${
                          signatureMode === mode ? "border-foreground bg-foreground text-background" : "border-border bg-white"
                        }`}
                      >
                        {mode === "none" ? "Add later" : mode}
                      </button>
                    ))}
                  </div>
                </div>

                {signatureMode === "upload" ? (
                  <Field label="Upload signature">
                    <Input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setSignaturePreviewUrl(URL.createObjectURL(file));
                      }}
                    />
                  </Field>
                ) : null}

                {signatureMode === "draw" ? (
                  <Field label="Draw signature">
                    <SignaturePad
                      value={drawSignature}
                      onChange={(value) => {
                        setDrawSignature(value);
                        setSignaturePreviewUrl(value || null);
                      }}
                    />
                  </Field>
                ) : null}

                {signatureMode === "typed" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Typed signature">
                      <Input name="signatureText" defaultValue={branding.signatureText ?? ""} />
                    </Field>
                    <Field label="Signature font">
                      <select name="signatureFont" defaultValue={branding.signatureFont ?? "Signature"} className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm">
                        <option value="Signature">Signature</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="DM Sans">DM Sans</option>
                      </select>
                    </Field>
                  </div>
                ) : null}

                <Button type="submit" variant="accent" className="w-full sm:w-fit" disabled={saving === "branding"}>
                  {saving === "branding" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save branding
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="defaults">
              <form action={saveDefaults} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Currency"><Input name="defaultCurrency" defaultValue={settings.defaultCurrency} /></Field>
                  <Field label="Timezone"><Input name="timezone" defaultValue={settings.timezone} /></Field>
                  <Field label="Invoice prefix"><Input name="invoicePrefix" defaultValue={settings.invoicePrefix} /></Field>
                  <Field label="Quotation prefix"><Input name="quotationPrefix" defaultValue={settings.quotationPrefix} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Language">
                    <select name="defaultLanguage" defaultValue={settings.defaultLanguage} className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm">
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="bilingual">Bilingual</option>
                    </select>
                  </Field>
                  <Field label="Tax rate">
                    <Input name="defaultTaxRate" type="number" step="0.1" defaultValue={settings.defaultTaxRate} />
                  </Field>
                </div>
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input name="taxEnabled" type="checkbox" className="size-4 accent-black" defaultChecked={settings.taxEnabled} />
                  Tax enabled by default
                </label>
                <div className="space-y-3">
                  <Label>Global document template</Label>
                  <p className="text-sm leading-6 text-muted-strong">
                    This template drives the live preview, private detail page, public share page, and exported PDF.
                  </p>
                  <DocumentTemplatePicker
                    inputName="documentTemplate"
                    value={settings.documentTemplate}
                    onChange={(value) => {
                      setSettings((current) => ({
                        ...current,
                        documentTemplate: value,
                      }));
                    }}
                  />
                </div>
                <Field label="Default notes"><Textarea name="defaultNotes" defaultValue={settings.defaultNotes} /></Field>
                <Field label="Default terms"><Textarea name="defaultTerms" defaultValue={settings.defaultTerms} /></Field>
                <Button type="submit" variant="accent" className="w-full sm:w-fit" disabled={saving === "defaults"}>
                  {saving === "defaults" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save defaults
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="hidden xl:block">
        <div className="sticky top-[7rem]">{previewNode}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
