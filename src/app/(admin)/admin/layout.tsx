import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";

// Never cache operator pages; never index them.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operator Console",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Authoritative gate (defense in depth alongside the middleware 404).
  const { adminEmail } = await requireAdmin();

  return <AdminShell adminEmail={adminEmail}>{children}</AdminShell>;
}
