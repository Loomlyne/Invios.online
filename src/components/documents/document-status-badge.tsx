import { Badge } from "@/components/ui/badge";

export function DocumentStatusBadge({
  status,
}: {
  status: string;
}) {
  const variant =
    status === "paid" || status === "accepted"
      ? "success"
      : status === "rejected" || status === "overdue"
        ? "warning"
        : "default";

  return (
    <Badge variant={variant}>
      {status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")}
    </Badge>
  );
}
