import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/data";

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

  return (
    <AppShell context={context}>
      {children}
    </AppShell>
  );
}
