import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { forgotPasswordAction } from "@/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset access without losing setup state."
      description="We will send a password-reset link to the email tied to your Invios account."
    >
      <AuthForm
        title="Forgot password"
        description="Send a secure reset link to the email tied to your Invios workspace."
        action={forgotPasswordAction}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@studio.com",
          },
        ]}
        footer={{
          prompt: "Remembered it?",
          label: "Sign in",
          href: "/sign-in",
        }}
        submitLabel="Send reset link"
      />
    </AuthShell>
  );
}
