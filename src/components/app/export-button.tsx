import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportDataButton({
  href,
  label = "Export",
  filename,
}: {
  href: string;
  label?: string;
  filename?: string;
}) {
  return (
    <Button asChild variant="secondary" size="sm">
      <a href={href} download={filename}>
        <Download className="size-4" />
        {label}
      </a>
    </Button>
  );
}
