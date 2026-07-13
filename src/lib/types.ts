import type { Route } from "next";

export type OnboardingStep = "business-profile" | "branding" | "defaults" | "preview";

export type SignatureMode = "none" | "upload" | "draw" | "typed";

export const SETTINGS_SECTIONS = [
  "profile",
  "branding",
  "business",
  "general",
  "emails",
  "integrations",
  "billing",
] as const;

export type SettingsSection = typeof SETTINGS_SECTIONS[number];
export type BrandingSection = "identity" | "business" | "template" | "documents";

export interface SettingsSectionConfig {
  key: SettingsSection;
  label: string;
  icon: string;
  description: string;
}

export type AppNavKey =
  | "dashboard"
  | "invoices"
  | "quotations"
  | "clients"
  | "branding"
  | "settings"
  | "new-invoice"
  | "new-quote"
  | "new-client"
  | "notes"
  | "expense"
  | "project";

export type SetupItemKey = "business-profile" | "branding" | "defaults" | "final-review";

export type AppNavIcon =
  | "layout-dashboard"
  | "receipt-text"
  | "file-text"
  | "users-round"
  | "palette"
  | "settings-2"
  | "user-round-plus"
  | "sticky-note"
  | "credit-card"
  | "folder-open"
  | "notebook-pen";

export interface AppNavItemConfig {
  key: AppNavKey;
  label: string;
  href: Route;
  icon: AppNavIcon;
  description: string;
}

export interface SetupItemStatus {
  id: SetupItemKey;
  label: string;
  description: string;
  href: Route;
  section?: SettingsSection | BrandingSection;
  complete: boolean;
}

export interface SetupProgress {
  items: SetupItemStatus[];
  completedCount: number;
  totalCount: number;
  percentage: number;
  readyForCompletion: boolean;
  complete: boolean;
}

export interface BusinessProfile {
  fullName: string;
  hourlyRate?: number | null;
  businessName: string;
  businessEmail: string;
  phone: string;
  website: string;
  address: string;
  trn: string;
  bankDetails: string;
  footerText: string;
}

export interface CustomFont {
  name: string;
  path: string;
  url?: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoPath?: string | null;
  faviconPath?: string | null;
  baseFont?: string | null;
  arabicBusinessName?: string | null;
  arabicAddress?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  spacing?: string | null;
  headerLayout?: string | null;
  lineItemsStyle?: string | null;
  signatureMode: SignatureMode;
  signaturePath?: string | null;
  signatureText?: string | null;
  signatureFont?: string | null;
  customFonts?: CustomFont[];
}

export interface UserSettings {
  defaultCurrency: string;
  defaultLanguage: "en" | "ar" | "bilingual";
  defaultTaxRate: number;
  taxEnabled: boolean;
  defaultTerms: string;
  defaultNotes: string;
  timezone: string;
  invoicePrefix: string;
  quotationPrefix: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderDaysAfter: number;
  remindOnDueDate: boolean;
  secondReminderDays: number;
  dateFormat: string;
  notifyQuoteAccepted: boolean;
  notifyPaymentReceived: boolean;
  notifyProjectActivity: boolean;
  notifyChatFromCustomer: boolean;
  notifyChatToCustomer: boolean;
}

export interface InvoicePreviewLineItem {
  id: string;
  description: string;
  notes?: string;
  arabicDescription?: string;
  quantity: number;
  unitPrice: number;
  durationValue?: number;
  durationUnit?: "hours" | "days" | "weeks" | "months";
}

export interface InvoicePreviewData {
  kind?: "invoice" | "quotation";
  title?: string;
  businessName: string;
  businessEmail: string;
  phone: string;
  website: string;
  address: string;
  trn: string;
  bankDetails: string;
  footerText: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientTrn?: string;
  currency: string;
  language: UserSettings["defaultLanguage"];
  taxRate: number;
  taxEnabled: boolean;
  discount?: number;
  issueDate: string;
  dueDate: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  invoiceNumber: string;
  statusLabel?: string;
  numberLabel?: string;
  accentColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  signatureMode: SignatureMode;
  signatureUrl?: string | null;
  signatureText?: string | null;
  signatureFont?: string | null;
  terms: string;
  notes: string;
  lineItems: InvoicePreviewLineItem[];
  headingFont?: string | null;
  bodyFont?: string | null;
  spacing?: string | null;
  headerLayout?: string | null;
  lineItemsStyle?: string | null;
}

export interface AppUserState {
  email: string;
  profile: BusinessProfile;
  branding: BrandingSettings;
  settings: UserSettings;
  onboardingStep: OnboardingStep;
  onboardingCompletedAt?: string | null;
}

export interface AppContext {
  configured: boolean;
  userId?: string;
  email?: string;
  avatarUrl?: string | null;
  userState: AppUserState;
  previewData: InvoicePreviewData;
  onboardingComplete: boolean;
  onboardingRequired: boolean;
  setupProgress: SetupProgress;
  setupChecklistDismissed: boolean;
  warnings: string[];
}

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
};

export type SubscriptionData = {
  status: "inactive" | "trialing" | "active" | "past_due" | "canceled" | "revoked";
  current_period_end: string | null;
  plan: string | null;
} | null;
