import { requireAdmin } from "@/lib/admin/guard";
import { AdminComingSoon } from "@/components/admin/coming-soon";

export default async function AdminBillingPage() {
  await requireAdmin();
  return (
    <AdminComingSoon
      wave="Wave 3"
      title="Billing & subscription control"
      description="See every Creem subscription joined to its account, spot lapsed or missing subscriptions, open a customer's billing portal, and reconcile a stuck status — all as audited, non-destructive safe actions."
    />
  );
}
