"use client";

import { useCallback } from "react";
import type { AppContext, ActionState } from "@/lib/types";
import { saveBusinessInfoAction } from "@/actions/app";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { useSettingsForm } from "../shared/use-settings-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";

const PAYMENT_METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "crypto", label: "Crypto" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
];

type BusinessFormValues = {
  businessName: string;
  businessEmail: string;
  phone: string;
  website: string;
  address: string;
  trn: string;
  // Payment details — stored as bankDetails string for now
  showPayment: boolean;
  paymentMethod: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingCode: string;
};

/** Parse structured fields from the single bankDetails string (line-separated key:value) */
function parseBankDetails(raw: string): Pick<BusinessFormValues, "bankName" | "accountName" | "accountNumber" | "routingCode" | "paymentMethod"> {
  const lines = raw.split("\n").map((l) => l.trim());
  const get = (prefix: string) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? "";
  return {
    paymentMethod: get("Method:") || "bank_transfer",
    bankName: get("Bank:"),
    accountName: get("Account:"),
    accountNumber: get("IBAN:"),
    routingCode: get("SWIFT:"),
  };
}

/** Serialize structured fields back to bankDetails string */
function serializeBankDetails(v: BusinessFormValues): string {
  const parts = [
    `Method: ${v.paymentMethod}`,
    v.bankName && `Bank: ${v.bankName}`,
    v.accountName && `Account: ${v.accountName}`,
    v.accountNumber && `IBAN: ${v.accountNumber}`,
    v.routingCode && `SWIFT: ${v.routingCode}`,
  ].filter(Boolean);
  return parts.join("\n");
}

export function BusinessInfoPanel({ context }: { context: AppContext }) {
  const p = context.userState.profile;
  const b = context.userState.branding;
  const parsed = parseBankDetails(p.bankDetails);

  const initialValues: BusinessFormValues = {
    businessName: b.arabicBusinessName ? p.businessName : p.businessName,
    businessEmail: p.businessEmail,
    phone: p.phone,
    website: p.website,
    address: p.address,
    trn: p.trn,
    showPayment: p.bankDetails.length > 0,
    paymentMethod: parsed.paymentMethod,
    bankName: parsed.bankName,
    accountName: parsed.accountName,
    accountNumber: parsed.accountNumber,
    routingCode: parsed.routingCode,
  };

  const handleSave = useCallback(
    async (values: BusinessFormValues): Promise<ActionState> => {
      return saveBusinessInfoAction({
        businessName: values.businessName,
        businessEmail: values.businessEmail,
        phone: values.phone,
        website: values.website,
        address: values.address,
        trn: values.trn,
        arabicBusinessName: b.arabicBusinessName ?? "",
        arabicAddress: b.arabicAddress ?? "",
        bankDetails: values.showPayment ? serializeBankDetails(values) : "",
      });
    },
    [b.arabicBusinessName, b.arabicAddress],
  );

  const { values, update, isDirty, save, message } =
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

      {/* Business Information */}
      <Section title="Business Information" description="Appears on invoices as 'From' details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business Name" htmlFor="bizName">
            <Input
              id="bizName"
              value={values.businessName}
              onChange={(e) => update("businessName", e.target.value)}
            />
          </Field>
          <Field label="Email" htmlFor="bizEmail">
            <Input
              id="bizEmail"
              type="email"
              value={values.businessEmail}
              onChange={(e) => update("businessEmail", e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="bizPhone">
            <Input
              id="bizPhone"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
          <Field label="Website" htmlFor="bizWebsite">
            <Input
              id="bizWebsite"
              value={values.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Address" htmlFor="bizAddress">
          <Textarea
            id="bizAddress"
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            rows={3}
          />
        </Field>
        <Field label="Tax ID / VAT Number" htmlFor="trn">
          <Input
            id="trn"
            value={values.trn}
            onChange={(e) => update("trn", e.target.value)}
            className="max-w-[300px]"
          />
        </Field>
      </Section>

      {/* Payment Details */}
      <Section title="Payment Details" description="Payment information shown on invoices">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted">Show on invoices</p>
          <Switch
            checked={values.showPayment}
            onCheckedChange={(v) => update("showPayment", v)}
          />
        </div>

        {values.showPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Default Payment Method" htmlFor="payMethod">
                <Select
                  id="payMethod"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={values.paymentMethod}
                  onChange={(v) => update("paymentMethod", v)}
                />
              </Field>
              <Field label="Bank Name" htmlFor="bankName">
                <Input
                  id="bankName"
                  value={values.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Account Name" htmlFor="accountName">
              <Input
                id="accountName"
                value={values.accountName}
                onChange={(e) => update("accountName", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Number / IBAN" htmlFor="iban">
                <Input
                  id="iban"
                  value={values.accountNumber}
                  onChange={(e) => update("accountNumber", e.target.value)}
                />
              </Field>
              <Field label="Routing / SWIFT Code" htmlFor="swift">
                <Input
                  id="swift"
                  value={values.routingCode}
                  onChange={(e) => update("routingCode", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}
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
