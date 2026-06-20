import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionData } from "@/lib/types";

function hexToTokens(hex: string) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      accent: hex, strong: hex,
      soft: "rgba(0,0,0,0.12)", glow: "rgba(0,0,0,0.24)",
      background: "#f8f4ee", bgLight: "#fdfbf8", bgDark: "#f2ede4",
      surface: "#fffdf9", surfaceStrong: "#f1e9dc",
      surfaceSubtle: "#fdf9f4", borderBrand: "#d7c4a7",
    };
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // Accent family — RGB-based (exact brand hue at varying opacity/brightness)
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const strong = `#${toHex(r * 0.7)}${toHex(g * 0.7)}${toHex(b * 0.7)}`;
  const soft = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.24)`;

  // Surface family — HSL-based (keep brand hue, adjust saturation + lightness)
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  const H = Math.round(h * 360);
  const hsl = (sat: number, lit: number) => `hsl(${H}, ${sat}%, ${lit}%)`;
  // Clamp saturation: low-saturation colors (greys) get minimal tint
  const tintS = Math.min(s * 100, 100) > 10 ? undefined : 0;
  const S = (base: number) => tintS ?? base;

  return {
    accent: hex, strong, soft, glow,
    background:     hsl(S(15),  96),
    bgLight:        hsl(S(10),  98.5),
    bgDark:         hsl(S(20),  93),
    surface:        hsl(S(8),   99),
    surfaceStrong:  hsl(S(18),  92),
    surfaceSubtle:  hsl(S(12),  97.5),
    borderBrand:    hsl(S(18),  82),
  };
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getAppContext();

  let subscription: SubscriptionData = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase && context.userId) {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, plan")
        .eq("user_id", context.userId)
        .maybeSingle<NonNullable<SubscriptionData>>();
      subscription = data ?? null;
    }
  } catch {
    // non-fatal
  }

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
  const t = hexToTokens(primaryColor);

  return (
    <>
      <style precedence="default">{`
        :root {
          --accent: ${t.accent};
          --accent-strong: ${t.strong};
          --accent-soft: ${t.soft};
          --accent-glow: ${t.glow};
          --background: ${t.background};
          --bg-light: ${t.bgLight};
          --bg-dark: ${t.bgDark};
          --surface: ${t.surface};
          --surface-strong: ${t.surfaceStrong};
          --surface-subtle: ${t.surfaceSubtle};
          --border-brand: ${t.borderBrand};
        }
      `}</style>
      <AppShell context={context} subscription={subscription}>
        {children}
      </AppShell>
    </>
  );
}
