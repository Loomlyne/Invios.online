"use client";

import { useCallback } from "react";
import type { AppContext, ActionState } from "@/lib/types";
import {
  saveDocumentsAction,
  saveGeneralSettingsAction,
  saveInvoiceDefaultsAction,
} from "@/actions/app";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { useSettingsForm } from "../shared/use-settings-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CURRENCY_SELECT_OPTIONS } from "@/lib/currencies";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "🇬🇧 English" },
  { value: "ar", label: "🇦🇪 Arabic" },
  { value: "bilingual", label: "🇬🇧/🇦🇪 Bilingual" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "d MMM yyyy", label: "1 Jan 2026" },
  { value: "dd/MM/yyyy", label: "01/01/2026" },
  { value: "MM/dd/yyyy", label: "01/01/2026" },
  { value: "yyyy-MM-dd", label: "2026-01-01" },
];

type GeneralFormValues = {
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  taxEnabled: boolean;
  timezone: string;
  dateFormat: string;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultNotes: string;
  defaultTerms: string;
};

export function GeneralPanel({ context }: { context: AppContext }) {
  const s = context.userState.settings;

  const initialValues: GeneralFormValues = {
    defaultLanguage: s.defaultLanguage,
    defaultCurrency: s.defaultCurrency,
    defaultTaxRate: s.defaultTaxRate,
    taxEnabled: s.taxEnabled,
    timezone: s.timezone,
    dateFormat: s.dateFormat,
    invoicePrefix: s.invoicePrefix,
    quotationPrefix: s.quotationPrefix,
    defaultNotes: s.defaultNotes,
    defaultTerms: s.defaultTerms,
  };

  const handleSave = useCallback(
    async (values: GeneralFormValues): Promise<ActionState> => {
      const profile = context.userState.profile;
      const [general, invoiceDefaults, documents] = await Promise.all([
        saveGeneralSettingsAction({
          fullName: profile.fullName,
          defaultCurrency: values.defaultCurrency,
          defaultLanguage: values.defaultLanguage as "en" | "ar" | "bilingual",
          defaultTaxRate: values.defaultTaxRate,
          taxEnabled: values.taxEnabled,
          timezone: values.timezone,
          dateFormat: values.dateFormat,
        }),
        saveInvoiceDefaultsAction({
          defaultNotes: values.defaultNotes,
          defaultTerms: values.defaultTerms,
        }),
        saveDocumentsAction({
          invoicePrefix: values.invoicePrefix,
          quotationPrefix: values.quotationPrefix,
          bankDetails: profile.bankDetails,
          footerText: profile.footerText,
        }),
      ]);
      if (general.status === "error") return general;
      if (invoiceDefaults.status === "error") return invoiceDefaults;
      if (documents.status === "error") return documents;
      return { status: "success", message: "General settings saved." };
    },
    [context.userState.profile],
  );

  const { values, update, isDirty, save, saveState, message } =
    useSettingsForm(initialValues, handleSave);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted mt-1">Manage your account &amp; preferences</p>
        </div>
        <div className="hidden lg:block">
          <SaveButton isDirty={isDirty} onSave={save} />
        </div>
      </div>

      {message && (
        <p className="text-sm text-danger">{message}</p>
      )}

      {/* General Settings */}
      <Section title="General Settings" description="Configure default document behavior">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Invoice Language" htmlFor="language">
            <Select
              id="language"
              options={LANGUAGE_OPTIONS}
              value={values.defaultLanguage}
              onChange={(v) => update("defaultLanguage", v)}
            />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Select
              id="currency"
              options={CURRENCY_SELECT_OPTIONS}
              value={values.defaultCurrency}
              onChange={(v) => update("defaultCurrency", v)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Tax Rate (%)" htmlFor="taxRate">
            <Input
              id="taxRate"
              type="number"
              min={0}
              max={100}
              value={values.defaultTaxRate}
              onChange={(e) => update("defaultTaxRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Date format" htmlFor="dateFormat">
            <Select
              id="dateFormat"
              options={DATE_FORMAT_OPTIONS}
              value={values.dateFormat}
              onChange={(v) => update("dateFormat", v)}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-[var(--radius-inner)] border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Include tax on new documents</p>
            <p className="text-sm text-muted">Show VAT line items using your default tax rate</p>
          </div>
          <Switch
            checked={values.taxEnabled}
            onCheckedChange={(v) => update("taxEnabled", v)}
          />
        </div>
      </Section>

      {/* Document Numbering */}
      <Section title="Document Numbering" description="Configure prefix, next number, and optional date for each document type">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Invoice Prefix" htmlFor="invoicePrefix">
            <Input
              id="invoicePrefix"
              value={values.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value)}
            />
          </Field>
          <Field label="Quote Prefix" htmlFor="quotationPrefix">
            <Input
              id="quotationPrefix"
              value={values.quotationPrefix}
              onChange={(e) => update("quotationPrefix", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Default document copy">
        <Field label="Default notes" htmlFor="defaultNotes">
          <Textarea
            id="defaultNotes"
            value={values.defaultNotes}
            onChange={(e) => update("defaultNotes", e.target.value)}
            rows={3}
            placeholder="Thank you for your business!"
          />
        </Field>
        <Field label="Default terms" htmlFor="defaultTerms">
          <Textarea
            id="defaultTerms"
            value={values.defaultTerms}
            onChange={(e) => update("defaultTerms", e.target.value)}
            rows={3}
            placeholder="Payment due within 14 days."
          />
        </Field>
      </Section>

      {/* Mobile sticky save */}
      <div className="lg:hidden sticky bottom-20 z-10">
        <div className="bg-surface/80 backdrop-blur-sm border-t border-border px-4 py-3 -mx-4">
          <SaveButton isDirty={isDirty} onSave={save} />
        </div>
      </div>
    </div>
  );
}
