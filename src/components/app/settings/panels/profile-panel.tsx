"use client";

import { startTransition, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, Loader2, Trash2, X } from "lucide-react";
import type { AppContext, ActionState } from "@/lib/types";
import { saveGeneralSettingsAction } from "@/actions/app";
import { changePasswordAction, deleteAccountAction } from "@/actions/auth";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { PasswordInput } from "../shared/password-input";
import { useSettingsForm } from "../shared/use-settings-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type ProfileFormValues = {
  fullName: string;
};

export function ProfilePanel({ context }: { context: AppContext }) {
  const initialValues: ProfileFormValues = {
    fullName: context.userState.profile.fullName,
  };

  const handleSave = useCallback(
    async (values: ProfileFormValues): Promise<ActionState> => {
      return saveGeneralSettingsAction({
        fullName: values.fullName,
        defaultCurrency: context.userState.settings.defaultCurrency,
        defaultLanguage: context.userState.settings.defaultLanguage,
        defaultTaxRate: context.userState.settings.defaultTaxRate,
        taxEnabled: context.userState.settings.taxEnabled,
        timezone: context.userState.settings.timezone,
      });
    },
    [context.userState.settings],
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

      {/* Personal Information */}
      <Section title="Personal Information" description="Your profile details visible across the app">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar placeholder — click to upload (Phase 10 will add real upload) */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="size-20 rounded-full bg-muted/20 border border-border flex items-center justify-center text-xl font-semibold text-muted-strong overflow-hidden">
              {values.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?"}
            </div>
            <p className="text-xs text-muted">Click to upload</p>
          </div>
          <div className="flex-1 space-y-4">
            <Field label="Full Name" htmlFor="fullName">
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                value={context.email ?? ""}
                readOnly
                className="bg-muted/10 cursor-not-allowed"
              />
              <p className="text-xs text-muted">Email cannot be changed here</p>
            </Field>
          </div>
        </div>
      </Section>

      {/* Hourly Rate */}
      <Section title="Hourly Rate" description="Your default hourly rate used for time tracking cost calculations">
        <Field label="Hourly Rate" htmlFor="hourlyRate">
          <div className="flex items-center gap-2 max-w-[200px]">
            <Input
              id="hourlyRate"
              type="number"
              min={0}
              defaultValue={50}
              placeholder="0"
            />
            <span className="text-sm text-muted font-medium shrink-0">AED</span>
          </div>
        </Field>
      </Section>

      {/* Change Password — self-contained, not part of SaveButton */}
      <ChangePasswordSection />

      {/* Danger Zone */}
      <DeleteAccountSection email={context.email ?? ""} />

      {/* Mobile sticky save */}
      <div className="lg:hidden sticky bottom-20 z-10">
        <div className="bg-surface/80 backdrop-blur-sm border-t border-border px-4 py-3 -mx-4">
          <SaveButton isDirty={isDirty} onSave={save} />
        </div>
      </div>
    </div>
  );
}

/* ─── Change Password (self-contained) ─────────────────────────────────────── */

function ChangePasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = newPassword.length >= 8 && confirmNewPassword.length >= 8;

  const handleSubmit = () => {
    setSaving(true);
    setMsg(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: "",
        newPassword,
        confirmNewPassword,
      });
      setSaving(false);
      if (result.status === "success") {
        setMsg({ type: "success", text: result.message ?? "Password updated." });
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setMsg({ type: "error", text: result.message ?? "Could not update password." });
      }
    });
  };

  return (
    <Section title="Change Password" description="Update your account password">
      <div className="grid gap-4">
        <Field label="New Password" htmlFor="newPw">
          <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPw">
          <PasswordInput value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Repeat new password" />
        </Field>
        {msg && (
          <div className={`rounded-[var(--radius-inner)] border px-4 py-3 text-sm ${msg.type === "success" ? "border-success/20 bg-[#F0F9F2] text-success" : "border-danger/20 bg-[#FFF5F3] text-danger"}`}>
            {msg.text}
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-fit"
          disabled={saving || !canSubmit}
          onClick={handleSubmit}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
          {saving ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── Delete Account (dialog confirmation) ─────────────────────────────────── */

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
    <Section danger title="Danger Zone" description="Irreversible actions">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Delete account</p>
          <p className="text-sm text-muted">Permanently delete your account and all associated data.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); setError(""); }}>
          <DialogTrigger asChild>
            <Button type="button" className="bg-danger text-white hover:bg-danger/90 shrink-0">
              <Trash2 className="mr-2 size-4" />
              Delete Account
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
              {error && (
                <div className="rounded-[1rem] border border-danger/20 bg-[#FFF5F3] px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
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
      </div>
    </Section>
  );
}
