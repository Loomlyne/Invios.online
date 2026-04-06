import Link from "next/link";
import type { Route } from "next";
import { StickyNote } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notes"
        description="Internal reminders, delivery notes, and client context."
      />

      <EmptyState
        icon={<StickyNote className="size-5" />}
        title="Notes are coming soon."
        description="This page is ready for real notes once the related schema and editor flow are added."
        actions={
          <Button asChild variant="secondary">
            <Link href={"/app" as Route}>Return to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
