import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { signInAction } from "@/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed:
    "That confirmation link is invalid or has expired. Sign in to request a new one, or reset your password.",
  config: "Authentication is not fully configured. Please contact support.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <AuthShell
      title="Return to the billing console."
      description="Sign in to manage clients, quotations, invoices, branding, and export-ready documents."
    >
      {errorMessage ? (
        <div
          role="alert"
          className="mb-6 rounded-[1rem] border border-[#E7B1A8] bg-[#FFF3F1] px-4 py-3 text-sm text-[#8D3D2E]"
        >
          {errorMessage}
        </div>
      ) : null}
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
