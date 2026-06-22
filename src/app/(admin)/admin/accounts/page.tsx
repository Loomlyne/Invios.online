import { requireAdmin } from "@/lib/admin/guard";
import { AdminComingSoon } from "@/components/admin/coming-soon";

export default async function AdminAccountsPage() {
  await requireAdmin();
  return (
    <AdminComingSoon
      wave="Wave 1"
      title="Accounts overview & search"
      description="Search and filter every account by email, name, plan, and activity — with per-account stats and health flags that surface who needs help. Drill into any account to see all of their clients, documents, payments, and settings."
    />
  );
}
