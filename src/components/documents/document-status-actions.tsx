import { ArrowRight, Send, Trash2 } from "lucide-react";
import { deleteInvoiceAction, setInvoiceStatusAction } from "@/actions/invoices";
import {
  convertQuotationToInvoiceAction,
  deleteQuotationAction,
  setQuotationStatusAction,
} from "@/actions/quotations";
import { Button } from "@/components/ui/button";

interface DocumentStatusActionsProps {
  kind: "invoice" | "quotation";
  id: string;
  status: string;
  convertedToInvoiceId?: string | null;
}

export function DocumentStatusActions({
  kind,
  id,
  status,
  convertedToInvoiceId,
}: DocumentStatusActionsProps) {
  if (kind === "invoice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {status === "draft" && (
          <form
            action={async () => {
              "use server";
              await setInvoiceStatusAction(id, "sent");
            }}
          >
            <Button type="submit" variant="accent" className="w-full">
              <Send className="size-4" />
              Mark as sent
            </Button>
          </form>
        )}

        <form
          action={async () => {
            "use server";
            await deleteInvoiceAction(id);
          }}
        >
          <Button type="submit" variant="danger" className="w-full">
            <Trash2 className="size-4" />
            Delete invoice
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {status === "draft" && (
        <form
          action={async () => {
            "use server";
            await setQuotationStatusAction(id, "sent");
          }}
        >
          <Button type="submit" variant="accent" className="w-full">
            <Send className="size-4" />
            Mark as sent
          </Button>
        </form>
      )}

      {status === "sent" && (
        <form
          action={async () => {
            "use server";
            await setQuotationStatusAction(id, "accepted");
          }}
        >
          <Button type="submit" variant="secondary" className="w-full">
            Mark as accepted
          </Button>
        </form>
      )}

      {status === "sent" && (
        <form
          action={async () => {
            "use server";
            await setQuotationStatusAction(id, "rejected");
          }}
        >
          <Button type="submit" variant="secondary" className="w-full">
            Mark as rejected
          </Button>
        </form>
      )}

      {status === "accepted" && convertedToInvoiceId === null && (
        <form
          action={async () => {
            "use server";
            await convertQuotationToInvoiceAction(id);
          }}
        >
          <Button type="submit" variant="accent" className="w-full">
            <ArrowRight className="size-4" />
            Convert to invoice
          </Button>
        </form>
      )}

      <form
        action={async () => {
          "use server";
          await deleteQuotationAction(id);
        }}
      >
        <Button type="submit" variant="danger" className="w-full">
          <Trash2 className="size-4" />
          Delete quotation
        </Button>
      </form>
    </div>
  );
}
