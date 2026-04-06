import { defaultSettings, sampleLineItems } from "@/lib/constants";
import { formatCurrency, hasValue } from "@/lib/utils";
import type {
  AppUserState,
  BrandingSettings,
  BusinessProfile,
  InvoicePreviewData,
  UserSettings,
} from "@/lib/types";

export const defaultProfile: BusinessProfile = {
  fullName: "",
  businessName: "Invios Studio",
  businessEmail: "hello@invios.app",
  phone: "+971 50 000 0000",
  website: "invios.app",
  address: "Dubai Design District, Building 7, Dubai, UAE",
  trn: "100412345600003",
  bankDetails: "Emirates NBD • 1234 5678 9012 • IBAN AE00 0000 0000 0000 0000 000",
  footerText: "Prepared with care for professional client delivery.",
};

export const defaultBranding: BrandingSettings = {
  primaryColor: "#CA8A04",
  secondaryColor: "#44403C",
  logoPath: null,
  signatureMode: "none",
  signaturePath: null,
  signatureText: "",
  signatureFont: "Signature",
};

export function createDefaultUserState(email = ""): AppUserState {
  return {
    email,
    profile: { ...defaultProfile },
    branding: { ...defaultBranding },
    settings: { ...defaultSettings },
    onboardingStep: "business-profile",
    onboardingCompletedAt: null,
  };
}

export function buildInvoicePreviewData(
  userState: AppUserState,
  overrides?: Partial<InvoicePreviewData>,
) {
  const base: InvoicePreviewData = {
    templateId: userState.settings.documentTemplate || defaultSettings.documentTemplate,
    kind: "invoice",
    title: "Invoice",
    businessName: userState.profile.businessName || defaultProfile.businessName,
    businessEmail: userState.profile.businessEmail || userState.email || defaultProfile.businessEmail,
    phone: userState.profile.phone || defaultProfile.phone,
    website: userState.profile.website || defaultProfile.website,
    address: userState.profile.address || defaultProfile.address,
    trn: userState.profile.trn || defaultProfile.trn,
    bankDetails: userState.profile.bankDetails || defaultProfile.bankDetails,
    footerText: userState.profile.footerText || defaultProfile.footerText,
    recipientName: "Studio client",
    recipientCompany: "Client company",
    recipientEmail: "billing@client.com",
    recipientPhone: "+971 50 000 1000",
    recipientAddress: "Business Bay, Dubai, UAE",
    currency: userState.settings.defaultCurrency || defaultSettings.defaultCurrency,
    language: userState.settings.defaultLanguage || defaultSettings.defaultLanguage,
    taxRate: userState.settings.defaultTaxRate ?? defaultSettings.defaultTaxRate,
    taxEnabled: userState.settings.taxEnabled ?? defaultSettings.taxEnabled,
    discount: 0,
    issueDate: "05 Apr 2026",
    dueDate: "12 Apr 2026",
    issueDateLabel: "Issue date",
    dueDateLabel: "Due date",
    invoiceNumber: `${userState.settings.invoicePrefix || "INV"}-0001`,
    statusLabel: "Draft",
    numberLabel: "Invoice no.",
    accentColor: userState.branding.primaryColor || defaultBranding.primaryColor,
    secondaryColor: userState.branding.secondaryColor || defaultBranding.secondaryColor,
    logoUrl: null,
    signatureMode: userState.branding.signatureMode,
    signatureUrl: null,
    signatureText: userState.branding.signatureText || "",
    signatureFont: userState.branding.signatureFont || "Signature",
    terms: userState.settings.defaultTerms || defaultSettings.defaultTerms,
    notes: userState.settings.defaultNotes || defaultSettings.defaultNotes,
    lineItems: sampleLineItems,
  };

  return { ...base, ...overrides };
}

export function getInvoiceTotals(preview: InvoicePreviewData) {
  const subtotal = preview.lineItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const discountAmount = subtotal * ((preview.discount ?? 0) / 100);
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const tax = preview.taxEnabled ? discountedSubtotal * (preview.taxRate / 100) : 0;
  const total = discountedSubtotal + tax;

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    tax,
    total,
    subtotalLabel: formatCurrency(subtotal, preview.currency),
    discountLabel: formatCurrency(discountAmount, preview.currency),
    discountedSubtotalLabel: formatCurrency(discountedSubtotal, preview.currency),
    taxLabel: formatCurrency(tax, preview.currency),
    totalLabel: formatCurrency(total, preview.currency),
  };
}

export function getBrandingWarnings(userState: AppUserState) {
  const warnings: string[] = [];

  if (!hasValue(userState.profile.businessName)) {
    warnings.push("Business name is missing.");
  }
  if (!hasValue(userState.branding.primaryColor)) {
    warnings.push("Primary brand color is still using the fallback.");
  }
  if (!userState.branding.logoPath) {
    warnings.push("Logo has not been uploaded yet.");
  }

  return warnings;
}
