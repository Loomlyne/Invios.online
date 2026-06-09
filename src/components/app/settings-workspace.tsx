"use client";

import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Bell, Camera, Check, ChevronRight, Eye, EyeOff, KeyRound, Loader2, LogOut, Mail, Palette, Settings2, Shield, SlidersHorizontal, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveGeneralSettingsAction,
  saveInvoiceDefaultsAction,
  saveNotificationsAction,
} from "@/actions/app";
import { signOutAction, changePasswordAction, deleteAccountAction, uploadAvatarAction, changeEmailAction } from "@/actions/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(context.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const formData = new FormData();
    formData.append("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      setAvatarUploading(false);
      if (result.status === "success" && result.avatarUrl) {
        setLocalAvatarUrl(result.avatarUrl);
      } else if (result.status === "error") {
        setAvatarError(result.message ?? "Upload failed.");
      }
    });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

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
          dateFormat: settings.dateFormat,
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
          notifyQuoteAccepted: settings.notifyQuoteAccepted,
          notifyPaymentReceived: settings.notifyPaymentReceived,
          notifyProjectActivity: settings.notifyProjectActivity,
          notifyChatFromCustomer: settings.notifyChatFromCustomer,
          notifyChatToCustomer: settings.notifyChatToCustomer,
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
          <div className="mt-4 rounded-[var(--radius-inner)] border border-black/8 bg-white px-4 py-3 text-sm text-muted-strong">
            {message}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="px-5 py-5 sm:px-6">
        {/* Branding shortcut — visible on mobile where sidebar nav is hidden */}
        <Link
          href="/app/settings?section=branding"
          className="mb-4 flex items-center gap-3 rounded-[var(--radius-inner)] border border-black/6 bg-surface px-4 py-3.5 transition hover:bg-surface-strong lg:hidden"
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
              <Section title="Profile" description="Your name and account email.">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative size-20 rounded-full overflow-hidden border border-border bg-muted/20 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    >
                      {localAvatarUrl ? (
                        <img src={localAvatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="size-full flex items-center justify-center text-xl font-semibold text-muted-strong">
                          {getInitials(profile.fullName)}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="size-5 text-white" />
                      </div>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    {avatarUploading ? (
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        Uploading…
                      </p>
                    ) : avatarError ? (
                      <p className="text-xs text-danger text-center max-w-[80px]">{avatarError}</p>
                    ) : (
                      <p className="text-xs text-muted">Click to upload</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <Field label="Name">
                      <Input
                        value={profile.fullName}
                        onChange={(e) => updateProfile("fullName", e.target.value)}
                      />
                    </Field>
                    <ChangeEmailSection email={context.email ?? ""} />
                  </div>
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
                <label className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
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
                <label className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
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

                <label className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3 text-sm text-muted-strong">
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
            <div className="grid gap-6">
              <Section title="Security overview" description="Your account identity and authentication method.">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3">
                    <Mail className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Email</p>
                      <p className="truncate text-sm font-medium text-foreground">{context.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3">
                    <Shield className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Authentication</p>
                      <p className="text-sm font-medium text-foreground">Email &amp; password</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-white px-4 py-3">
                    <KeyRound className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Password strength</p>
                      <p className="text-sm font-medium text-foreground">Set — last changed via settings or reset link</p>
                    </div>
                  </div>
                </div>
              </Section>

              <ChangePasswordSection />

              <Section title="Sign out" description="End your current session and return to the sign-in page.">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-fit"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </Button>
              </Section>

              <DeleteAccountSection email={context.email ?? ""} />
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

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
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
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`grid gap-4 rounded-[var(--radius-card)] border p-5 ${danger ? "border-danger/20 bg-[#FFF5F3]" : "border-border bg-white"}`}>
      <div>
        <p className={`text-sm font-semibold ${danger ? "text-danger" : "text-foreground"}`}>{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ChangeEmailSection({ email }: { email: string }) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = newEmail.length > 3 && confirmEmail.length > 3;

  const handleSubmit = () => {
    setSaving(true);
    setMessage(null);
    startTransition(async () => {
      const result = await changeEmailAction({ newEmail, confirmEmail });
      setSaving(false);
      if (result.status === "success") {
        setMessage({ type: "success", text: result.message ?? "Check your inbox." });
        setEditing(false);
        setNewEmail("");
        setConfirmEmail("");
      } else {
        setMessage({ type: "error", text: result.message ?? "Could not update email." });
      }
    });
  };

  const cancel = () => {
    setEditing(false);
    setNewEmail("");
    setConfirmEmail("");
    setMessage(null);
  };

  return (
    <div className="space-y-2">
      <Label>Email</Label>
      {editing ? (
        <div className="space-y-3">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            autoFocus
          />
          <Input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="Confirm new email"
          />
          {message ? (
            <p className={`text-xs ${message.type === "success" ? "text-[#1a7a3a]" : "text-danger"}`}>
              {message.text}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving || !canSubmit}
              onClick={handleSubmit}
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : null}
              {saving ? "Sending…" : "Send confirmation"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Input value={email} readOnly className="bg-muted/10 cursor-not-allowed" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => setEditing(true)}
            >
              Change
            </Button>
          </div>
          {message ? (
            <p className={`text-xs ${message.type === "success" ? "text-[#1a7a3a]" : "text-danger"}`}>
              {message.text}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && confirmNewPassword.length >= 8;

  const handleSubmit = () => {
    setSaving(true);
    setMessage(null);

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setSaving(false);

      if (result.status === "success") {
        setMessage({ type: "success", text: result.message ?? "Password updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setMessage({ type: "error", text: result.message ?? "Could not update password." });
      }
    });
  };

  return (
    <Section title="Change password" description="Update your password. You'll need your current password to confirm.">
      <div className="grid gap-4">
        <Field label="Current password">
          <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Repeat new password" />
          </Field>
        </div>
        {message ? (
          <div className={`rounded-[var(--radius-inner)] border px-4 py-3 text-sm ${message.type === "success" ? "border-success/20 bg-[#F0F9F2] text-success" : "border-danger/20 bg-[#FFF5F3] text-danger"}`}>
            {message.text}
          </div>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-fit"
          disabled={saving || !canSubmit}
          onClick={handleSubmit}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </Section>
  );
}

function DeleteAccountSection({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = () => {
    setDeleting(true);
    setError("");

    startTransition(async () => {
      const result = await deleteAccountAction(confirmation);
      setDeleting(false);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo as "/sign-in");
      } else {
        setError(result.message ?? "Could not delete account.");
      }
    });
  };

  return (
    <Section danger title="Delete account" description="Permanently delete your account and all associated data. This action cannot be undone.">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); setError(""); }}>
        <DialogTrigger asChild>
          <Button type="button" className="w-full bg-danger text-white hover:bg-danger/90 sm:w-fit">
            <Trash2 className="mr-2 size-4" />
            Delete my account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="size-5 text-danger" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Delete account permanently</p>
                <p className="text-sm text-muted">{email}</p>
              </div>
            </div>

            <div className="rounded-[1rem] border border-danger/20 bg-[#FFF5F3] px-4 py-3 text-sm text-danger">
              This will permanently delete your account, all invoices, quotations, clients, branding, and settings. This cannot be reversed.
            </div>

            <Field label={<>Type <span className="font-mono font-semibold">DELETE</span> to confirm</>}>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </Field>

            {error ? (
              <div className="rounded-[1rem] border border-danger/20 bg-[#FFF5F3] px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              disabled={confirmation !== "DELETE" || deleting}
              onClick={handleDelete}
              className="w-full bg-danger text-white hover:bg-danger/90"
            >
              {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              {deleting ? "Deleting…" : "Permanently delete account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
