import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signUpAction } from "@/actions/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create the workspace before the first invoice."
      description="Set up the billing console, branding defaults, and document template so every quotation, invoice, public link, and PDF starts consistent."
    >
      <AuthForm
        title="Create account"
        description="This account opens the operator console, live document preview, and billing workspace."
        action={signUpAction}
        fields={[
          {
            name: "fullName",
            label: "Full name",
            autoComplete: "name",
            placeholder: "Koussay Aloui",
          },
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
            autoComplete: "new-password",
            placeholder: "Minimum 8 characters",
          },
        ]}
        footer={{
          prompt: "Already have an account?",
          label: "Sign in",
          href: "/sign-in",
        }}
        submitLabel="Create account"
      />
      <div className="mt-5 text-sm text-muted">
        Need a reset instead?{" "}
        <Link href="/forgot-password" className="font-medium text-foreground underline-offset-4 hover:underline">
          Reset your password
        </Link>
      </div>
    </AuthShell>
  );
}
