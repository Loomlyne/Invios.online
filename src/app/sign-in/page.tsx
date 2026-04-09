import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signInAction } from "@/actions/auth";

export default function SignInPage() {
  return (
    <AuthShell
      title="Return to the billing console."
      description="Sign in to manage clients, quotations, invoices, branding, and export-ready documents."
    >
      <AuthForm
        title="Sign in"
        description="Use the same email and password you configured for your Invios workspace."
        action={signInAction}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@studio.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            placeholder: "••••••••",
          },
        ]}
        footer={{
          prompt: "New here?",
          label: "Create account",
          href: "/sign-up",
        }}
        submitLabel="Enter Invios"
        forgotPasswordHref="/forgot-password"
      />
    </AuthShell>
  );
}
