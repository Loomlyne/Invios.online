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

  return (
    <>
      <Button variant="inverse" size="sm" onClick={() => setOpen(true)}>
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
        </MobileSheetContent>
      </MobileSheet>
    </>
  );
}

export function ClientDeleteButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const archiveWithId = archiveClientAction.bind(null, clientId);

  return (
    <form
      action={archiveWithId}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${clientName}? Existing invoices and quotations will be kept.`)) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="inverse"
        size="sm"
        className="border-danger/50 bg-danger/20 text-on-dark shadow-none hover:border-danger hover:bg-danger"
      >
        <Trash2 className="size-4" />
        Delete client
      </Button>
    </form>
  );
}
