import type {
  AppNavItemConfig,
  InvoicePreviewLineItem,
  OnboardingStep,
  UserSettings,
} from "@/lib/types";

export const bottomNavItems: AppNavItemConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/app",
    icon: "layout-dashboard",
    description: "Workspace summary and setup readiness.",
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/app/invoices",
    icon: "receipt-text",
    description: "Draft, share, and export live invoices.",
  },
  {
    key: "quotations",
    label: "Quotes",
    href: "/app/quotations",
    icon: "file-text",
    description: "Scope work, share quotations, and convert accepted deals.",
  },
  {
    key: "clients",
    label: "Clients",
    href: "/app/clients",
    icon: "users-round",
    description: "Manage the client records tied to every document.",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/app/settings",
    icon: "settings-2",
    description: "Preferences, invoice defaults, and notifications.",
  },
];

export const fabMenuItems: AppNavItemConfig[] = [
  {
    key: "new-invoice",
    label: "Invoice",
    href: "/app/invoices/new",
    icon: "receipt-text",
    description: "Create a new invoice.",
  },
  {
    key: "new-quote",
    label: "Quote",
    href: "/app/quotations/new",
    icon: "file-text",
    description: "Create a new quotation.",
  },
  {
    key: "new-client",
    label: "Client",
    href: "/app/clients",
    icon: "user-round-plus",
    description: "Add a new client.",
  },
  {
    key: "expense",
    label: "Expense",
    href: "/app/expenses" as unknown as import("next").Route,
    icon: "credit-card",
    description: "Record an expense.",
  },
  {
    key: "project",
    label: "Project",
    href: "/app/projects" as unknown as import("next").Route,
    icon: "folder-open",
    description: "Start a new project.",
  },
  {
    key: "notes",
    label: "Notes",
    href: "/app/notes",
    icon: "notebook-pen",
    description: "Quick notes and reminders.",
  },
];

export const appNavItems: AppNavItemConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/app",
    icon: "layout-dashboard",
    description: "Workspace summary and setup readiness.",
  },
  {
    key: "invoices",
    label: "Invoices",
    href: "/app/invoices",
    icon: "receipt-text",
    description: "Draft, share, and export live invoices.",
  },
  {
    key: "quotations",
    label: "Quotations",
    href: "/app/quotations",
    icon: "file-text",
    description: "Scope work, share quotations, and convert accepted deals.",
  },
  {
    key: "clients",
    label: "Clients",
    href: "/app/clients",
    icon: "users-round",
    description: "Manage the client records tied to every document.",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/app/settings",
    icon: "settings-2",
    description: "Preferences, invoice defaults, and notifications.",
  },
];

export const onboardingSteps: {
  id: OnboardingStep;
  label: string;
  eyebrow: string;
  description: string;
}[] = [
  {
    id: "business-profile",
    label: "Business profile",
    eyebrow: "Step 1",
    description: "Identity, trust cues, and operator details.",
  },
  {
    id: "branding",
    label: "Branding",
    eyebrow: "Step 2",
    description: "Logo, color, and signature preferences.",
  },
  {
    id: "defaults",
    label: "Defaults",
    eyebrow: "Step 3",
    description: "Currency, tax, terms, notes, and prefixes.",
  },
  {
    id: "preview",
    label: "Preview",
    eyebrow: "Step 4",
    description: "Check the first branded invoice surface.",
  },
];

export const sampleLineItems: InvoicePreviewLineItem[] = [
  {
    id: "1",
    description: "Discovery and strategic project framing",
    quantity: 1,
    unitPrice: 4200,
  },
  {
    id: "2",
    description: "Interface direction and billing workflow setup",
    quantity: 1,
    unitPrice: 2850,
  },
  {
    id: "3",
    description: "Mobile polish, installability, and handoff package",
    quantity: 1,
    unitPrice: 1750,
  },
];

export const SIGNATURE_FONTS = ["Signature", "Cormorant Garamond", "DM Sans", "Lora", "EB Garamond"];

export const HEADING_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Libre Baskerville",
  "DM Sans",
  "Lora",
  "Merriweather",
  "EB Garamond",
  "Crimson Text",
  "Poppins",
  "Montserrat",
  "Outfit",
  "Raleway",
];

export const BODY_FONTS = [
  "Lato",
  "DM Sans",
  "Inter",
  "Source Sans 3",
  "Roboto",
  "Open Sans",
  "Nunito",
  "Work Sans",
  "Rubik",
  "Manrope",
  "Plus Jakarta Sans",
  "IBM Plex Sans",
];

export const defaultSettings: UserSettings = {
  defaultCurrency: "AED",
  defaultLanguage: "en",
  defaultTaxRate: 5,
  taxEnabled: true,
  defaultTerms:
    "Payment due within 7 days of issue. Late balances may pause delivery until resolved.",
  defaultNotes:
    "Thank you for the opportunity. This document reflects the approved scope and delivery cadence.",
  timezone: "Asia/Dubai",
  invoicePrefix: "INV",
  quotationPrefix: "QUO",
  documentTemplate: "classic",
  reminderEnabled: false,
  reminderDaysBefore: 3,
  reminderDaysAfter: 7,
  remindOnDueDate: true,
  secondReminderDays: 14,
  dateFormat: "d MMM yyyy",
  notifyQuoteAccepted: true,
  notifyPaymentReceived: true,
  notifyProjectActivity: false,
  notifyChatFromCustomer: true,
  notifyChatToCustomer: true,
};
