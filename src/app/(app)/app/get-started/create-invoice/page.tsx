import Link from "next/link";
import type { Route } from "next";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function CreateInvoiceHandoffPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid gap-6">
        <PageHeader
          title="Create invoice"
          description="The invoice builder opens once the document engine lands."
        />

        <EmptyState
          icon={<Lock className="size-5" />}
          title="Builder locked until Phase 2"
          description="Business identity, branding, defaults, and preview are all live. The actual CRUD builder stays scoped to the next phase."
          actions={
            <>
              <Button asChild variant="accent">
                <Link href={"/app" as Route}>Return to dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={"/app/settings" as Route}>Refine settings</Link>
              </Button>
            </>
          }
        />
      </div>
    </div>
  );
}
