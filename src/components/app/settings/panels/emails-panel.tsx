"use client";

import { useCallback } from "react";
import type { AppContext, ActionState } from "@/lib/types";
import { saveNotificationsAction } from "@/actions/app";
import { Section, Field } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";
import { useSettingsForm } from "../shared/use-settings-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type EmailFormValues = {
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderDaysAfter: number;
  remindOnDueDate: boolean;
  secondReminderDays: number;
};

export function EmailsPanel({ context }: { context: AppContext }) {
  const s = context.userState.settings;

  const initialValues: EmailFormValues = {
    reminderEnabled: s.reminderEnabled,
    reminderDaysBefore: s.reminderDaysBefore,
    reminderDaysAfter: s.reminderDaysAfter,
    remindOnDueDate: s.remindOnDueDate,
    secondReminderDays: s.secondReminderDays,
  };

  const handleSave = useCallback(
    async (values: EmailFormValues): Promise<ActionState> => {
      return saveNotificationsAction(values);
    },
    [],
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

      {/* Email Notifications */}
      <Section title="Email Notifications" description="Manage which emails you receive and send">
        <div className="space-y-6">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto payment reminders</p>
              <p className="text-sm text-muted">Automatically send a reminder email when an invoice becomes overdue</p>
            </div>
            <Switch
              checked={values.reminderEnabled}
              onCheckedChange={(v) => update("reminderEnabled", v)}
            />
          </div>

          {/* Reminder config — only shown when enabled */}
          {values.reminderEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-accent/20">
              <Field label="Days before due date" htmlFor="daysBefore">
                <Input
                  id="daysBefore"
                  type="number"
                  min={0}
                  max={30}
                  value={values.reminderDaysBefore}
                  onChange={(e) => update("reminderDaysBefore", Number(e.target.value))}
                />
              </Field>
              <Field label="Days after due date" htmlFor="daysAfter">
                <Input
                  id="daysAfter"
                  type="number"
                  min={0}
                  max={60}
                  value={values.reminderDaysAfter}
                  onChange={(e) => update("reminderDaysAfter", Number(e.target.value))}
                />
              </Field>
              <div className="flex items-center justify-between sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Remind on due date</p>
                  <p className="text-sm text-muted">Send a reminder on the exact due date</p>
                </div>
                <Switch
                  checked={values.remindOnDueDate}
                  onCheckedChange={(v) => update("remindOnDueDate", v)}
                />
              </div>
              <Field label="Second reminder (days after due)" htmlFor="secondReminder">
                <Input
                  id="secondReminder"
                  type="number"
                  min={0}
                  max={90}
                  value={values.secondReminderDays}
                  onChange={(e) => update("secondReminderDays", Number(e.target.value))}
                />
              </Field>
            </div>
          )}
        </div>
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
