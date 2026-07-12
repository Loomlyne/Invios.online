"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, Fingerprint, KeyRound, Loader2, Trash2 } from "lucide-react";
import type { AppContext, ActionState } from "@/lib/types";
import { saveProfileSettingsAction } from "@/actions/app";
import {
  changePasswordAction,
  deleteAccountAction,
  uploadAvatarAction,
  changeEmailAction,
} from "@/actions/auth";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { PasswordInput } from "../shared/password-input";
import { useSettingsForm } from "../shared/use-settings-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileFormValues = {
  fullName: string;
  hourlyRate: string;
};

export function ProfilePanel({ context }: { context: AppContext }) {
  const initialValues: ProfileFormValues = {
    fullName: context.userState.profile.fullName,
    hourlyRate:
      context.userState.profile.hourlyRate != null
        ? String(context.userState.profile.hourlyRate)
        : "",
  };

  const handleSave = useCallback(
    async (values: ProfileFormValues): Promise<ActionState> => {
      return saveProfileSettingsAction({
        fullName: values.fullName,
        hourlyRate: values.hourlyRate === "" ? null : Number(values.hourlyRate),
      });
    },
    [],
  );

  const { values, update, isDirty, save, message } =
    useSettingsForm(initialValues, handleSave);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted mt-1">Manage your account &amp; preferences</p>
        </div>
        <div className="hidden lg:block">
          <SaveButton isDirty={isDirty} onSave={save} />
        </div>
      </div>

      {message && (
        <p className="text-sm text-danger">{message}</p>
      )}

      <Section title="Personal Information" description="Your profile details visible across the app">
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
                  {getInitials(values.fullName)}
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
            <Field label="Full Name" htmlFor="fullName">
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </Field>
            <Field label="Hourly rate (optional)" htmlFor="hourlyRate">
              <Input
                id="hourlyRate"
                type="number"
                min={0}
                step="0.01"
                value={values.hourlyRate}
                onChange={(e) => update("hourlyRate", e.target.value)}
                placeholder="e.g. 350"
              />
            </Field>
            <ChangeEmailField email={context.email ?? ""} />
          </div>
        </div>
      </Section>

      <ChangePasswordSection />

      <PasskeysSection />

      <DeleteAccountSection email={context.email ?? ""} />

      <div className="lg:hidden sticky bottom-20 z-10">
        <div className="bg-surface/80 backdrop-blur-sm border-t border-border px-4 py-3 -mx-4">
          <SaveButton isDirty={isDirty} onSave={save} />
        </div>
      </div>
    </div>
  );
}

/* ─── Change Email ──────────────────────────────────────────────────────────── */

function ChangeEmailField({ email }: { email: string }) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = newEmail.length > 3 && confirmEmail.length > 3;

  const handleSubmit = () => {
    setSaving(true);
    setMsg(null);
    startTransition(async () => {
      const result = await changeEmailAction({ newEmail, confirmEmail });
      setSaving(false);
      if (result.status === "success") {
        setMsg({ type: "success", text: result.message ?? "Check your inbox." });
        setEditing(false);
        setNewEmail("");
        setConfirmEmail("");
      } else {
        setMsg({ type: "error", text: result.message ?? "Could not update email." });
      }
    });
  };

  const cancel = () => {
    setEditing(false);
    setNewEmail("");
    setConfirmEmail("");
    setMsg(null);
  };

  return (
    <div className="flex flex-col gap-2">
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
          {msg ? (
            <p className={`text-xs ${msg.type === "success" ? "text-[#1a7a3a]" : "text-danger"}`}>
              {msg.text}
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
          {msg ? (
            <p className={`text-xs ${msg.type === "success" ? "text-[#1a7a3a]" : "text-danger"}`}>
              {msg.text}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ─── Change Password ───────────────────────────────────────────────────────── */

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 8 && confirmNewPassword.length >= 8;

  const handleSubmit = () => {
    setSaving(true);
    setMsg(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setSaving(false);
      if (result.status === "success") {
        setMsg({ type: "success", text: result.message ?? "Password updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setMsg({ type: "error", text: result.message ?? "Could not update password." });
      }
    });
  };

  return (
    <Section
      title="Change Password"
      description="Update your account password. You'll need your current password to confirm."
    >
      <div className="grid gap-4">
        <Field label="Current Password" htmlFor="currentPw">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New Password" htmlFor="newPw">
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirmPw">
            <PasswordInput
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Repeat new password"
            />
          </Field>
        </div>
        {msg && (
          <div
            className={`rounded-[var(--radius-inner)] border px-4 py-3 text-sm ${
              msg.type === "success"
                ? "border-success/20 bg-[#F0F9F2] text-success"
                : "border-danger/20 bg-[#FFF5F3] text-danger"
            }`}
          >
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
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 size-4" />
          )}
          {saving ? "Updating…" : "Update Password"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── Passkeys ───────────────────────────────────────────────────────────────── */

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

function PasskeysSection() {
  const [supported, setSupported] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyItem[] | null>(null);
  const [registering, setRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPasskeys = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error: listError } = await supabase.auth.passkey.list();
    if (listError) {
      setError(listError.message || "Could not load passkeys.");
      return;
    }
    setPasskeys(data ?? []);
  }, []);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "PublicKeyCredential" in window &&
        typeof window.PublicKeyCredential === "function",
    );
    loadPasskeys();
  }, [loadPasskeys]);

  const handleRegister = () => {
    setRegistering(true);
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setRegistering(false);
        return;
      }
      const { error: registerError } = await supabase.auth.registerPasskey();
      setRegistering(false);
      if (registerError) {
        if (registerError.name === "AbortError" || registerError.message?.includes("aborted")) return;
        setError(registerError.message || "Could not register passkey.");
        return;
      }
      loadPasskeys();
    });
  };

  const handleDelete = (passkeyId: string) => {
    setRemovingId(passkeyId);
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setRemovingId(null);
        return;
      }
      const { error: deleteError } = await supabase.auth.passkey.delete({ passkeyId });
      setRemovingId(null);
      if (deleteError) {
        setError(deleteError.message || "Could not remove passkey.");
        return;
      }
      setPasskeys((prev) => prev?.filter((p) => p.id !== passkeyId) ?? null);
    });
  };

  if (!supported) return null;

  return (
    <Section
      title="Passkeys"
      description="Sign in with biometrics or a security key instead of your password."
    >
      <div className="space-y-4">
        {passkeys && passkeys.length > 0 ? (
          <ul className="divide-y divide-border rounded-[var(--radius-inner)] border border-border">
            {passkeys.map((pk) => (
              <li key={pk.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Fingerprint className="size-4 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pk.friendly_name || "Passkey"}
                    </p>
                    <p className="text-xs text-muted">
                      Added {new Date(pk.created_at).toLocaleDateString()}
                      {pk.last_used_at
                        ? ` · Last used ${new Date(pk.last_used_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={removingId === pk.id}
                  onClick={() => handleDelete(pk.id)}
                >
                  {removingId === pk.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        ) : passkeys ? (
          <p className="text-sm text-muted">No passkeys registered yet.</p>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button
          type="button"
          variant="secondary"
          disabled={registering}
          onClick={handleRegister}
        >
          {registering ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 size-4" />
          )}
          {registering ? "Waiting for passkey…" : "Add a passkey"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── Delete Account ────────────────────────────────────────────────────────── */

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
          <p className="text-sm text-muted">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            setConfirmation("");
            setError("");
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90 shrink-0"
            >
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
                  <p className="text-sm font-semibold text-foreground">
                    Delete account permanently
                  </p>
                  <p className="text-sm text-muted">{email}</p>
                </div>
              </div>
              <div className="rounded-[1rem] border border-danger/20 bg-[#FFF5F3] px-4 py-3 text-sm text-danger">
                This will permanently delete your account, all invoices, quotations, clients,
                branding, and settings. This cannot be reversed.
              </div>
              <Field
                label={
                  <>
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm
                  </>
                }
              >
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
                {deleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                {deleting ? "Deleting…" : "Permanently delete account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Section>
  );
}
