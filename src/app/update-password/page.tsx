import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { updatePasswordAction } from "@/actions/auth";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a fresh password and return to the shell."
      description="Once updated, your existing setup and preview data remain intact."
    >
      <AuthForm
        title="Update password"
        description="Use a strong password to secure the business setup you have already created."
        action={updatePasswordAction}
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "Minimum 8 characters",
          },
          {
            name: "confirmPassword",
            label: "Confirm password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "Repeat the same password",
          },
        ]}
        footer={{
          prompt: "Back to auth?",
          label: "Sign in",
          href: "/sign-in",
        }}
        submitLabel="Update password"
      />
    </AuthShell>
  );
}
