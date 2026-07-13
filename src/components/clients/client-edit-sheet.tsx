"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Archive, PencilLine } from "lucide-react";
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
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div>
      {isConfirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-inner)] border border-danger/30 bg-danger/10 p-2">
          <p className="basis-full text-xs text-muted-strong">
            Archive {clientName}? Existing invoices and quotations will remain available.
          </p>
          <form action={archiveWithId}>
            <ArchiveSubmitButton />
          </form>
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="inverse"
          size="sm"
          onClick={() => setIsConfirming(true)}
          className="border-danger/50 bg-danger/20 text-on-dark shadow-none hover:border-danger hover:bg-danger"
        >
          <Archive className="size-4" />
          Archive client
        </Button>
      )}
    </div>
  );
}

function ArchiveSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      <Archive className="size-4" />
      {pending ? "Archiving..." : "Confirm archive"}
    </Button>
  );
}
