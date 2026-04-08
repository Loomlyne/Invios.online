"use client";

import { startTransition, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Loader2, LogOut, Settings2, SlidersHorizontal, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveGeneralSettingsAction,
  saveInvoiceDefaultsAction,
  saveNotificationsAction,
} from "@/actions/app";
import { signOutAction } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AppContext, SettingsSection } from "@/lib/types";

export function SettingsWorkspace({
  context,
  initialSection = "general",
}: {
  context: AppContext;
  initialSection?: SettingsSection;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(context.userState.profile);
  const [settings, setSettings] = useState(context.userState.settings);
  const [activeTab, setActiveTab] = useState<SettingsSection>(initialSection);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");

  const saveGeneral = async (formData: FormData) => {
    setSaving("general");
    setMessage("");
    const values = {
      fullName: String(formData.get("fullName") || ""),
      defaultCurrency: String(formData.get("defaultCurrency") || ""),
      defaultLanguage: String(formData.get("defaultLanguage") || "en") as "en" | "ar" | "bilingual",
      defaultTaxRate: Number(formData.get("defaultTaxRate") || 0),
      taxEnabled: formData.get("taxEnabled") === "on",
      timezone: String(formData.get("timezone") || ""),
    };

    startTransition(async () => {
      const result = await saveGeneralSettingsAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setProfile((current) => ({ ...current, fullName: values.fullName }));
        setSettings((current) => ({
          ...current,
          defaultCurrency: values.defaultCurrency,
          defaultLanguage: values.defaultLanguage,
          defaultTaxRate: values.defaultTaxRate,
          taxEnabled: values.taxEnabled,
          timezone: values.timezone,
        }));
      }
    });
  };

  const saveInvoices = async (formData: FormData) => {
    setSaving("invoices");
    setMessage("");
    const values = {
      defaultNotes: String(formData.get("defaultNotes") || ""),
      defaultTerms: String(formData.get("defaultTerms") || ""),
    };

    startTransition(async () => {
      const result = await saveInvoiceDefaultsAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setSettings((current) => ({
          ...current,
          defaultNotes: values.defaultNotes,
          defaultTerms: values.defaultTerms,
        }));
      }
    });
  };

  const saveNotifications = async (formData: FormData) => {
    setSaving("notifications");
    setMessage("");
    const values = {
      reminderEnabled: formData.get("reminderEnabled") === "on",
      reminderDaysBefore: Number(formData.get("reminderDaysBefore") || 3),
      reminderDaysAfter: Number(formData.get("reminderDaysAfter") || 7),
      remindOnDueDate: formData.get("remindOnDueDate") === "on",
      secondReminderDays: Number(formData.get("secondReminderDays") || 14),
    };

    startTransition(async () => {
      const result = await saveNotificationsAction(values);
      setSaving("");
      setMessage(result.message ?? "");
      if (result.status === "success") {
        setSettings((current) => ({ ...current, ...values }));
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await signOutAction();
      if (result.redirectTo) {
        router.push(result.redirectTo as "/sign-in");
      }
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="border-b border-black/8 px-5 py-5 sm:px-6">
        <div>
          <Badge variant="accent">Preferences</Badge>
          <CardTitle className="mt-3">Settings</CardTitle>
          <CardDescription className="mt-2 max-w-2xl">
            Manage your profile, preferences, and invoice defaults.
          </CardDescription>
        </div>
        {message ? (
          <div className="mt-4 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-muted-strong">
            {message}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="px-5 py-5 sm:px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsSection)}>
          <TabsList>
            <TabsTrigger value="general">
              <Settings2 className="mr-2 size-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="mr-2 size-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 size-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account">
              <SlidersHorizontal className="mr-2 size-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* ── General ─────────────────────────────────────── */}
          <TabsContent value="general">
            <form action={saveGeneral} className="grid gap-6">
              <Section title="Profile" description="Your name as it appears on invoices and communications.">
                <div className="grid gap-4">
                  <Field label="Name">
                    <Input name="fullName" defaultValue={profile.fullName} />
                  </Field>
                  <Field label="Email">
                    <Input value={context.email ?? ""} readOnly className="bg-surface text-muted" />
                  </Field>
                </div>
              </Section>

              <Section title="Preferences" description="Default values used across all new documents.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default Currency">
                    <Input name="defaultCurrency" defaultValue={settings.defaultCurrency} placeholder="AED" />
                  </Field>
                  <Field label="Default Tax Rate (%)">
                    <Input name="defaultTaxRate" type="number" step="0.1" min="0" max="100" defaultValue={settings.defaultTaxRate} />
                  </Field>
                  <Field label="Timezone">
                    <Input name="timezone" defaultValue={settings.timezone} placeholder="Asia/Dubai" />
                  </Field>
                  <Field label="Default Language">
                    <Select
                      name="defaultLanguage"
                      defaultValue={settings.defaultLanguage}
                      options={[
                        { value: "en", label: "English" },
                        { value: "ar", label: "Arabic" },
                        { value: "bilingual", label: "Bilingual" },
                      ]}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input
                    name="taxEnabled"
                    type="checkbox"
                    className="size-4 accent-black"
                    defaultChecked={settings.taxEnabled}
                  />
                  Tax enabled by default
                </label>
              </Section>

              <Button
                type="submit"
                variant="accent"
                className="w-full sm:w-fit"
                disabled={saving === "general"}
              >
                {saving === "general" ? <Loader2 className="size-4 animate-spin" /> : null}
                Save general settings
              </Button>
            </form>
          </TabsContent>

          {/* ── Invoices ─────────────────────────────────────── */}
          <TabsContent value="invoices">
            <form action={saveInvoices} className="grid gap-6">
              <Section
                title="Invoice Defaults"
                description="Pre-fill fields when creating new invoices. You can always edit them per document."
              >
                <div className="grid gap-4">
                  <Field label="Default Notes">
                    <Textarea name="defaultNotes" rows={4} defaultValue={settings.defaultNotes} />
                  </Field>
                  <Field label="Default Terms">
                    <Textarea name="defaultTerms" rows={4} defaultValue={settings.defaultTerms} />
                  </Field>
                </div>
              </Section>

              <Button
                type="submit"
                variant="accent"
                className="w-full sm:w-fit"
                disabled={saving === "invoices"}
              >
                {saving === "invoices" ? <Loader2 className="size-4 animate-spin" /> : null}
                Save invoice defaults
              </Button>
            </form>
          </TabsContent>

          {/* ── Notifications ────────────────────────────────── */}
          <TabsContent value="notifications">
            <form action={saveNotifications} className="grid gap-6">
              <Section title="Payment Reminders" description="Reminders are sent automatically based on your due date settings.">
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input
                    name="reminderEnabled"
                    type="checkbox"
                    className="size-4 accent-black"
                    defaultChecked={settings.reminderEnabled}
                  />
                  Enable payment reminders
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Days before due date">
                    <Input
                      name="reminderDaysBefore"
                      type="number"
                      min="0"
                      max="365"
                      defaultValue={settings.reminderDaysBefore}
                    />
                  </Field>
                  <Field label="Days after due date">
                    <Input
                      name="reminderDaysAfter"
                      type="number"
                      min="0"
                      max="365"
                      defaultValue={settings.reminderDaysAfter}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input
                    name="remindOnDueDate"
                    type="checkbox"
                    className="size-4 accent-black"
                    defaultChecked={settings.remindOnDueDate}
                  />
                  Remind on due date
                </label>

                <Field label="Second reminder (days after due)">
                  <Input
                    name="secondReminderDays"
                    type="number"
                    min="0"
                    max="365"
                    defaultValue={settings.secondReminderDays}
                    className="sm:max-w-[200px]"
                  />
                </Field>
              </Section>

              <Button
                type="submit"
                variant="accent"
                className="w-full sm:w-fit"
                disabled={saving === "notifications"}
              >
                {saving === "notifications" ? <Loader2 className="size-4 animate-spin" /> : null}
                Save reminder settings
              </Button>
            </form>
          </TabsContent>

          {/* ── Account ──────────────────────────────────────── */}
          <TabsContent value="account">
            <div className="grid gap-4">
              <Section title="Sign Out" description="Sign out of the application. This will return you to the sign-in page.">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-fit"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </Button>
              </Section>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 rounded-[1.4rem] border border-border bg-white p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
