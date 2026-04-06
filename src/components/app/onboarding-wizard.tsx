"use client";

import { useMemo, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Paintbrush } from "lucide-react";
import { z } from "zod";
import { completeOnboardingAction, saveBrandingStepAction, saveBusinessProfileAction, saveDefaultsAction } from "@/actions/app";
import { onboardingSteps } from "@/lib/constants";
import { DocumentTemplatePicker } from "@/components/documents/document-template-picker";
import { buildInvoicePreviewData } from "@/lib/preview";
import type { AppUserState, InvoicePreviewData, SignatureMode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/app/signature-pad";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { cn } from "@/lib/utils";

const businessSchema = z.object({
  fullName: z.string().min(2),
  businessName: z.string().min(2),
  businessEmail: z.string().email(),
  phone: z.string().min(5),
  website: z.string(),
  address: z.string().min(10),
  trn: z.string(),
  bankDetails: z.string(),
  footerText: z.string(),
});

const defaultsSchema = z.object({
  defaultCurrency: z.string().min(3),
  defaultLanguage: z.enum(["en", "ar", "bilingual"]),
  defaultTaxRate: z.number().min(0).max(100),
  taxEnabled: z.boolean(),
  defaultTerms: z.string().min(12),
  defaultNotes: z.string().min(12),
  timezone: z.string().min(3),
  invoicePrefix: z.string().min(2),
  quotationPrefix: z.string().min(2),
  documentTemplate: z.enum(["classic", "executive", "minimal"]),
});

type BusinessValues = z.infer<typeof businessSchema>;
type DefaultsValues = z.infer<typeof defaultsSchema>;

export function OnboardingWizard({
  userState,
  previewData,
}: {
  userState: AppUserState;
  previewData: InvoicePreviewData;
}) {
  const [currentStep, setCurrentStep] = useState(userState.onboardingStep);
  const [feedback, setFeedback] = useState<string>("");
  const [pendingStep, setPendingStep] = useState<string>("");
  const [profile, setProfile] = useState(userState.profile);
  const [branding, setBranding] = useState(userState.branding);
  const [settings, setSettings] = useState(userState.settings);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(previewData.logoUrl ?? null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(previewData.signatureUrl ?? null);
  const [drawSignature, setDrawSignature] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const businessForm = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: profile,
  });

  const defaultsForm = useForm<DefaultsValues>({
    resolver: zodResolver(defaultsSchema),
    defaultValues: settings,
  });

  const brandingForm = useForm<{
    primaryColor: string;
    secondaryColor: string;
    signatureMode: SignatureMode;
    signatureText: string;
    signatureFont: string;
  }>({
    defaultValues: {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      signatureMode: branding.signatureMode,
      signatureText: branding.signatureText ?? "",
      signatureFont: branding.signatureFont ?? "Signature",
    },
  });

  const livePreview = useMemo(() => {
    return buildInvoicePreviewData(
      {
        ...userState,
        profile,
        branding: {
          ...branding,
          primaryColor: brandingForm.watch("primaryColor") || branding.primaryColor,
          secondaryColor:
            brandingForm.watch("secondaryColor") || branding.secondaryColor,
          signatureMode:
            brandingForm.watch("signatureMode") || branding.signatureMode,
          signatureText:
            brandingForm.watch("signatureText") || branding.signatureText,
          signatureFont:
            brandingForm.watch("signatureFont") || branding.signatureFont,
        },
        settings: {
          ...settings,
          ...defaultsForm.watch(),
        },
      },
      {
        logoUrl: logoPreviewUrl,
        signatureUrl:
          brandingForm.watch("signatureMode") === "upload" ||
          brandingForm.watch("signatureMode") === "draw"
            ? signaturePreviewUrl
            : null,
        signatureText: brandingForm.watch("signatureText") || branding.signatureText,
        signatureFont: brandingForm.watch("signatureFont") || branding.signatureFont,
        signatureMode: brandingForm.watch("signatureMode") || branding.signatureMode,
      },
    );
  }, [
    branding,
    brandingForm,
    defaultsForm,
    logoPreviewUrl,
    profile,
    settings,
    signaturePreviewUrl,
    userState,
  ]);

  const onBusinessSubmit = businessForm.handleSubmit((values) => {
    setPendingStep("business-profile");
    setFeedback("");
    startTransition(async () => {
      const result = await saveBusinessProfileAction(values);
      setPendingStep("");
      setFeedback(result.message ?? "");
      if (result.status === "success") {
        setProfile((current) => ({ ...current, ...values }));
        setCurrentStep("branding");
      }
    });
  });

  const onBrandingSubmit = brandingForm.handleSubmit((values) => {
    setPendingStep("branding");
    setFeedback("");
    startTransition(async () => {
      const formData = new FormData();
      formData.append("primaryColor", values.primaryColor || "");
      formData.append("secondaryColor", values.secondaryColor || "");
      formData.append("signatureMode", values.signatureMode);
      formData.append("signatureText", values.signatureText || "");
      formData.append("signatureFont", values.signatureFont || "");
      formData.append("drawSignature", drawSignature);
      formData.append("keepLogoPath", branding.logoPath ?? "");
      formData.append("keepSignaturePath", branding.signaturePath ?? "");

      const logoFile = logoInputRef.current?.files?.[0];
      const signatureFile = signatureInputRef.current?.files?.[0];

      if (logoFile) {
        formData.append("logo", logoFile);
      }
      if (signatureFile) {
        formData.append("signatureFile", signatureFile);
      }

      const result = await saveBrandingStepAction(formData);
      setPendingStep("");
      setFeedback(result.message ?? "");
      if (result.status === "success") {
        setBranding((current) => ({
          ...current,
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          signatureMode: values.signatureMode,
          signatureText: values.signatureText,
          signatureFont: values.signatureFont,
        }));
        setCurrentStep("defaults");
      }
    });
  });

  const onDefaultsSubmit = defaultsForm.handleSubmit((values) => {
    setPendingStep("defaults");
    setFeedback("");
    startTransition(async () => {
      const result = await saveDefaultsAction(values);
      setPendingStep("");
      setFeedback(result.message ?? "");
      if (result.status === "success") {
        setSettings(values);
        setCurrentStep("preview");
      }
    });
  });

  const completeOnboarding = () => {
    setPendingStep("preview");
    setFeedback("");
    startTransition(async () => {
      const result = await completeOnboardingAction();
      if (result?.status === "error") {
        setFeedback(result.message ?? "");
        setPendingStep("");
      } else {
        // D-09: redirect into create-first-invoice rather than generic dashboard
        router.push("/app/invoices/new");
      }
    });
  };

  const previewNode = <InvoicePreview preview={livePreview} />;

  return (
    <div className="fixed inset-0 z-40 bg-[#140F0B]/72 px-3 py-4 backdrop-blur-sm md:px-6 md:py-6">
      <div className="mx-auto grid h-full max-w-[1380px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,540px)]">
        <Card className="relative overflow-hidden border-white/10 bg-[#F9F5EE] p-0">
          <div className="border-b border-black/8 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Setup</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="secondary" size="sm" className="lg:hidden">
                    Preview
                  </Button>
                </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    {previewNode}
                  </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 flex gap-1">
              {onboardingSteps.map((step, index) => {
                const isActive = currentStep === step.id;
                const activeIndex = onboardingSteps.findIndex((item) => item.id === currentStep);
                const isDone = index < activeIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-foreground/8 font-medium text-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {isDone ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <span className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                        isActive ? "bg-foreground text-background" : "bg-foreground/10 text-muted",
                      )}>
                        {index + 1}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">
            {feedback ? (
              <div className="mb-5 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-muted-strong">
                {feedback}
              </div>
            ) : null}

            {currentStep === "business-profile" ? (
              <form className="grid gap-5" onSubmit={onBusinessSubmit}>
                <CardHeader className="px-0">
                  <CardTitle>Business identity and contact layer</CardTitle>
                  <CardDescription>
                    This is the non-negotiable setup that makes documents trustworthy.
                  </CardDescription>
                </CardHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name">
                    <Input {...businessForm.register("fullName")} />
                  </Field>
                  <Field label="Business name">
                    <Input {...businessForm.register("businessName")} />
                  </Field>
                  <Field label="Business email">
                    <Input type="email" {...businessForm.register("businessEmail")} />
                  </Field>
                  <Field label="Phone">
                    <Input {...businessForm.register("phone")} />
                  </Field>
                </div>
                <Field label="Website">
                  <Input {...businessForm.register("website")} />
                </Field>
                <Field label="Business address">
                  <Textarea className="min-h-[110px]" {...businessForm.register("address")} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="TRN">
                    <Input {...businessForm.register("trn")} />
                  </Field>
                  <Field label="Footer line">
                    <Input {...businessForm.register("footerText")} />
                  </Field>
                </div>
                <Field label="Bank details">
                  <Textarea className="min-h-[110px]" {...businessForm.register("bankDetails")} />
                </Field>
                <Button type="submit" variant="accent" size="lg" className="w-full sm:w-fit" disabled={pendingStep === "business-profile"}>
                  {pendingStep === "business-profile" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save and continue
                </Button>
              </form>
            ) : null}

            {currentStep === "branding" ? (
              <form className="grid gap-5" onSubmit={onBrandingSubmit}>
                <CardHeader className="px-0">
                  <CardTitle>Branding can start now and finish later</CardTitle>
                  <CardDescription>
                    Logo and signature can evolve. The billing shell should already feel premium.
                  </CardDescription>
                </CardHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary color">
                    <Input type="color" className="h-14 p-2" {...brandingForm.register("primaryColor")} />
                  </Field>
                  <Field label="Secondary color">
                    <Input type="color" className="h-14 p-2" {...brandingForm.register("secondaryColor")} />
                  </Field>
                </div>

                <Field label="Logo upload">
                  <div className="space-y-3">
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
                    {logoPreviewUrl ? (
                      <div className="flex items-center gap-3 rounded-[1rem] border border-border bg-white p-3">
                        <img src={logoPreviewUrl} alt="Logo preview" className="h-10 w-10 rounded-full object-cover" />
                        <p className="text-sm text-muted">Current logo preview</p>
                      </div>
                    ) : (
                      <div className="rounded-[1rem] border border-dashed border-border bg-white p-4 text-sm text-muted">
                        Upload a logo now, or keep refining with the default wordmark preview.
                      </div>
                    )}
                  </div>
                </Field>

                <div className="space-y-3">
                  <Label>Signature mode</Label>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {(["none", "upload", "draw", "typed"] as SignatureMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => brandingForm.setValue("signatureMode", mode)}
                        className={cn(
                          "rounded-[1rem] border px-4 py-3 text-sm font-medium capitalize transition",
                          brandingForm.watch("signatureMode") === mode
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-white text-foreground hover:bg-[#FFF7EA]",
                        )}
                      >
                        {mode === "none" ? "Add later" : mode}
                      </button>
                    ))}
                  </div>
                </div>

                {brandingForm.watch("signatureMode") === "upload" ? (
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

                {brandingForm.watch("signatureMode") === "draw" ? (
                  <Field label="Draw signature">
                    <SignaturePad
                      value={drawSignature}
                      onChange={(next) => {
                        setDrawSignature(next);
                        setSignaturePreviewUrl(next || null);
                      }}
                    />
                  </Field>
                ) : null}

                {brandingForm.watch("signatureMode") === "typed" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Typed signature">
                      <Input {...brandingForm.register("signatureText")} placeholder="e.g. Koussay Aloui" />
                    </Field>
                    <Field label="Signature font">
                      <select
                        className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm"
                        {...brandingForm.register("signatureFont")}
                      >
                        <option value="Signature">Signature</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="DM Sans">DM Sans</option>
                      </select>
                    </Field>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="accent" size="lg" disabled={pendingStep === "branding"}>
                    {pendingStep === "branding" ? <Loader2 className="size-4 animate-spin" /> : <Paintbrush className="size-4" />}
                    Save branding
                  </Button>
                  <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentStep("defaults")}>
                    Skip for now
                  </Button>
                </div>
              </form>
            ) : null}

            {currentStep === "defaults" ? (
              <form className="grid gap-5" onSubmit={onDefaultsSubmit}>
                <CardHeader className="px-0">
                  <CardTitle>Document defaults that unblock the builder later</CardTitle>
                  <CardDescription>
                    These are required before the app can safely move into real document creation.
                  </CardDescription>
                </CardHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default currency">
                    <Input {...defaultsForm.register("defaultCurrency")} />
                  </Field>
                  <Field label="Timezone">
                    <Input {...defaultsForm.register("timezone")} />
                  </Field>
                  <Field label="Invoice prefix">
                    <Input {...defaultsForm.register("invoicePrefix")} />
                  </Field>
                  <Field label="Quotation prefix">
                    <Input {...defaultsForm.register("quotationPrefix")} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default language">
                    <select className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm" {...defaultsForm.register("defaultLanguage")}>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="bilingual">Bilingual</option>
                    </select>
                  </Field>
                  <Field label="Tax rate">
                    <Input type="number" step="0.1" {...defaultsForm.register("defaultTaxRate", { valueAsNumber: true })} />
                  </Field>
                </div>

                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input type="checkbox" className="size-4 accent-black" {...defaultsForm.register("taxEnabled")} />
                  Tax is enabled by default on new documents
                </label>
                <div className="space-y-3">
                  <Label>Default document template</Label>
                  <DocumentTemplatePicker
                    inputName="documentTemplate"
                    value={defaultsForm.watch("documentTemplate")}
                    onChange={(value) => defaultsForm.setValue("documentTemplate", value)}
                  />
                </div>

                <Field label="Default notes">
                  <Textarea {...defaultsForm.register("defaultNotes")} />
                </Field>
                <Field label="Default terms">
                  <Textarea {...defaultsForm.register("defaultTerms")} />
                </Field>

                <Button type="submit" variant="accent" size="lg" className="w-full sm:w-fit" disabled={pendingStep === "defaults"}>
                  {pendingStep === "defaults" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save defaults
                </Button>
              </form>
            ) : null}

            {currentStep === "preview" ? (
              <div className="grid gap-5">
                <CardHeader className="px-0">
                  <CardTitle>Preview and finish</CardTitle>
                  <CardDescription>
                    The real builder is Phase 2. This confirms the shell is brand-ready enough to continue.
                  </CardDescription>
                </CardHeader>

                <div className="grid gap-4 rounded-[1.3rem] border border-border bg-white p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">Business</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{profile.businessName}</p>
                    <p className="mt-1 text-sm text-muted">{profile.businessEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">Defaults</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{settings.defaultCurrency}</p>
                    <p className="mt-1 text-sm text-muted">{settings.defaultLanguage}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">Branding</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {branding.primaryColor ? "Styled" : "Using fallback palette"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Signature mode: {brandingForm.watch("signatureMode")}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-amber-700/10 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  If you skipped logo or signature, Invios will still continue. Document flows will surface an unbranded-draft warning until you finish them in settings.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="accent" size="lg" onClick={completeOnboarding} disabled={pendingStep === "preview"}>
                    {pendingStep === "preview" ? <Loader2 className="size-4 animate-spin" /> : null}
                    Finish setup
                  </Button>
                  <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentStep("branding")}>
                    Review branding
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="hidden lg:block">
          <div className="sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto">
            {previewNode}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
