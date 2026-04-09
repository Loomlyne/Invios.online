"use client";

import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Check, ChevronRight, Loader2, LogOut, Palette, Settings2, SlidersHorizontal, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveGeneralSettingsAction,
  saveInvoiceDefaultsAction,
  saveNotificationsAction,
} from "@/actions/app";
import { signOutAction } from "@/actions/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AppContext, SettingsSection, UserSettings } from "@/lib/types";

type Profile = AppContext["userState"]["profile"];

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  // Snapshot of last-persisted values for dirty detection
  const savedProfile = useRef<Profile>(context.userState.profile);
  const savedSettings = useRef<UserSettings>(context.userState.settings);

  const isDirty = useMemo(() => {
    const p = savedProfile.current;
    const s = savedSettings.current;
    return (
      profile.fullName !== p.fullName ||
      settings.defaultCurrency !== s.defaultCurrency ||
      settings.defaultLanguage !== s.defaultLanguage ||
      settings.defaultTaxRate !== s.defaultTaxRate ||
      settings.taxEnabled !== s.taxEnabled ||
      settings.timezone !== s.timezone ||
      settings.defaultNotes !== s.defaultNotes ||
      settings.defaultTerms !== s.defaultTerms ||
      settings.reminderEnabled !== s.reminderEnabled ||
      settings.reminderDaysBefore !== s.reminderDaysBefore ||
      settings.reminderDaysAfter !== s.reminderDaysAfter ||
      settings.remindOnDueDate !== s.remindOnDueDate ||
      settings.secondReminderDays !== s.secondReminderDays
    );
  }, [profile, settings]);

  // Helpers for controlled inputs
  const updateProfile = useCallback(<K extends keyof Profile>(key: K, value: Profile[K]) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveAll = useCallback(() => {
    setSaving(true);
    setSaved(false);
    setMessage("");

    startTransition(async () => {
      const results = await Promise.all([
        saveGeneralSettingsAction({
          fullName: profile.fullName,
          defaultCurrency: settings.defaultCurrency,
          defaultLanguage: settings.defaultLanguage,
          defaultTaxRate: settings.defaultTaxRate,
          taxEnabled: settings.taxEnabled,
          timezone: settings.timezone,
        }),
        saveInvoiceDefaultsAction({
          defaultNotes: settings.defaultNotes,
          defaultTerms: settings.defaultTerms,
        }),
        saveNotificationsAction({
          reminderEnabled: settings.reminderEnabled,
          reminderDaysBefore: settings.reminderDaysBefore,
          reminderDaysAfter: settings.reminderDaysAfter,
          remindOnDueDate: settings.remindOnDueDate,
          secondReminderDays: settings.secondReminderDays,
        }),
      ]);

      setSaving(false);
      const failed = results.find((r) => r.status === "error");

      if (failed) {
        setMessage(failed.message ?? "Could not save settings.");
      } else {
        setSaved(true);
        savedProfile.current = { ...profile };
        savedSettings.current = { ...settings };
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }, [profile, settings]);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="accent">Preferences</Badge>
            <CardTitle className="mt-3">Settings</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              Manage your profile, preferences, and invoice defaults.
            </CardDescription>
          </div>
          {/* Universal save button — header (desktop) */}
          <Button
            type="button"
            variant="accent"
            className="hidden shrink-0 sm:flex"
            disabled={saving || (!isDirty && !saved)}
            onClick={saveAll}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 size-4" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </div>
        {message ? (
          <div className="mt-4 rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-muted-strong">
            {message}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="px-5 py-5 sm:px-6">
        {/* Branding shortcut — visible on mobile where sidebar nav is hidden */}
        <Link
          href="/app/branding"
          className="mb-4 flex items-center gap-3 rounded-[1.15rem] border border-black/6 bg-surface px-4 py-3.5 transition hover:bg-surface-strong lg:hidden"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Palette className="size-4 text-accent-strong" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Branding</p>
            <p className="text-xs text-muted">Logo, colors, fonts, and document identity.</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </Link>

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
            <div className="grid gap-6">
              <Section title="Profile" description="Your name as it appears on invoices and communications.">
                <div className="grid gap-4">
                  <Field label="Name">
                    <Input
                      value={profile.fullName}
                      onChange={(e) => updateProfile("fullName", e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <Input value={context.email ?? ""} readOnly className="bg-surface text-muted" />
                  </Field>
                </div>
              </Section>

              <Section title="Preferences" description="Default values used across all new documents.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default Currency">
                    <Input
                      value={settings.defaultCurrency}
                      onChange={(e) => updateSettings("defaultCurrency", e.target.value)}
                      placeholder="AED"
                    />
                  </Field>
                  <Field label="Default Tax Rate (%)">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.defaultTaxRate}
                      onChange={(e) => updateSettings("defaultTaxRate", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Timezone">
                    <Input
                      value={settings.timezone}
                      onChange={(e) => updateSettings("timezone", e.target.value)}
                      placeholder="Asia/Dubai"
                    />
                  </Field>
                  <Field label="Default Language">
                    <Select
                      value={settings.defaultLanguage}
                      onChange={(v) => updateSettings("defaultLanguage", v as "en" | "ar" | "bilingual")}
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
                    type="checkbox"
                    className="size-4 accent-black"
                    checked={settings.taxEnabled}
                    onChange={(e) => updateSettings("taxEnabled", e.target.checked)}
                  />
                  Tax enabled by default
                </label>
              </Section>
            </div>
          </TabsContent>

          {/* ── Invoices ─────────────────────────────────────── */}
          <TabsContent value="invoices">
            <div className="grid gap-6">
              <Section
                title="Invoice Defaults"
                description="Pre-fill fields when creating new invoices. You can always edit them per document."
              >
                <div className="grid gap-4">
                  <Field label="Default Notes">
                    <Textarea
                      rows={4}
                      value={settings.defaultNotes}
                      onChange={(e) => updateSettings("defaultNotes", e.target.value)}
                    />
                  </Field>
                  <Field label="Default Terms">
                    <Textarea
                      rows={4}
                      value={settings.defaultTerms}
                      onChange={(e) => updateSettings("defaultTerms", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>
            </div>
          </TabsContent>

          {/* ── Notifications ────────────────────────────────── */}
          <TabsContent value="notifications">
            <div className="grid gap-6">
              <Section title="Payment Reminders" description="Reminders are sent automatically based on your due date settings.">
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input
                    type="checkbox"
                    className="size-4 accent-black"
                    checked={settings.reminderEnabled}
                    onChange={(e) => updateSettings("reminderEnabled", e.target.checked)}
                  />
                  Enable payment reminders
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Days before due date">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminderDaysBefore}
                      onChange={(e) => updateSettings("reminderDaysBefore", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Days after due date">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.reminderDaysAfter}
                      onChange={(e) => updateSettings("reminderDaysAfter", Number(e.target.value))}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
                  <input
                    type="checkbox"
                    className="size-4 accent-black"
                    checked={settings.remindOnDueDate}
                    onChange={(e) => updateSettings("remindOnDueDate", e.target.checked)}
                  />
                  Remind on due date
                </label>

                <Field label="Second reminder (days after due)">
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={settings.secondReminderDays}
                    onChange={(e) => updateSettings("secondReminderDays", Number(e.target.value))}
                    className="sm:max-w-[200px]"
                  />
                </Field>
              </Section>
            </div>
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

        {/* Universal save button — sticky bottom (mobile) */}
        <div className="sticky bottom-4 mt-6 sm:hidden">
          <Button
            type="button"
            variant="accent"
            className="w-full"
            disabled={saving || (!isDirty && !saved)}
            onClick={saveAll}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 size-4" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </div>
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
