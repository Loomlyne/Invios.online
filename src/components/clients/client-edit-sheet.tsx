"use client";

import { useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import { archiveClientAction, updateClientAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { MobileSheet, MobileSheetContent, MobileSheetHeader } from "@/components/ui/mobile-sheet";
import type { ClientFormInput } from "@/lib/billing";

interface ClientEditButtonProps {
  client: Partial<ClientFormInput> & { id: string };
}

export function ClientEditButton({ client }: ClientEditButtonProps) {
  const [open, setOpen] = useState(false);
  const archiveWithId = archiveClientAction.bind(null, client.id);

  return (
    <>
      <Button variant="inverse" onClick={() => setOpen(true)}>
        <PencilLine className="size-4" />
        Edit client
      </Button>

      <MobileSheet open={open} onOpenChange={setOpen}>
        <MobileSheetContent title="Edit client">
          <MobileSheetHeader
            title="Edit client"
            description="Changes here update the shared client record that invoices and quotations point at."
          />
          <ClientForm action={updateClientAction} submitLabel="Update client" initialValue={client} />
          <form action={archiveWithId} className="mt-4">
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="size-4" />
              Archive client
            </Button>
          </form>
        </MobileSheetContent>
      </MobileSheet>
    </>
  );
}
