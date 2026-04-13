import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/data";

function hexToAccentTokens(hex: string): { accent: string; strong: string; soft: string; glow: string } {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return { accent: hex, strong: hex, soft: `rgba(0,0,0,0.12)`, glow: `rgba(0,0,0,0.24)` };
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const strong = `#${toHex(r * 0.7)}${toHex(g * 0.7)}${toHex(b * 0.7)}`;
  const soft = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.24)`;
  return { accent: hex, strong, soft, glow };
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getAppContext();

  if (context.configured && !context.email) {
    redirect("/sign-in");
  }

  if (!context.configured) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <Badge variant="warning">Configuration required</Badge>
            <CardTitle className="mt-3">Add Supabase before the private shell can run.</CardTitle>
            <CardDescription className="mt-2">
              Auth, storage, and the private billing workspace need your real Supabase project values in <code>.env.local</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-strong">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, and <code>NEXT_PUBLIC_SITE_URL</code>, then run the SQL migration in <code>supabase/migrations</code>.
          </CardContent>
        </Card>
      </main>
    );
  }

  const primaryColor = context.userState.branding.primaryColor || "#CA8A04";
  const { accent, strong, soft, glow } = hexToAccentTokens(primaryColor);

  return (
    <div
      style={
        {
          display: "contents",
          "--accent": accent,
          "--accent-strong": strong,
          "--accent-soft": soft,
          "--accent-glow": glow,
        } as React.CSSProperties
      }
    >
      <AppShell context={context}>
        {children}
      </AppShell>
    </div>
  );
}
