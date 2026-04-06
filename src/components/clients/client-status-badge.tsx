import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/lib/billing";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={status === "active" ? "success" : "warning"}>
      {status === "active" ? "Active" : "Lead"}
    </Badge>
  );
}
