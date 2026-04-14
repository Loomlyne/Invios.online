"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptQuotationPublicAction,
  rejectQuotationPublicAction,
} from "@/actions/public-quotations";

interface AcceptRejectFormProps {
  shareToken: string;
  currentStatus: string;
}

const initialState = { status: "idle" as const, message: "" };

export function AcceptRejectForm({ shareToken, currentStatus }: AcceptRejectFormProps) {
  const boundAccept = acceptQuotationPublicAction.bind(null, shareToken);
  const boundReject = rejectQuotationPublicAction.bind(null, shareToken);

  const [acceptState, acceptAction, acceptPending] = useActionState(boundAccept, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(boundReject, initialState);

  const [showRejectNote, setShowRejectNote] = useState(false);

  if (currentStatus === "accepted") {
    return (
      <p className="text-sm font-medium text-success">This quotation has been accepted.</p>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <p className="text-sm font-medium text-danger">This quotation has been rejected.</p>
    );
  }

  if (acceptState.status === "success") {
    return (
      <p className="text-sm font-medium text-success">
        Quotation accepted — the sender has been notified.
      </p>
    );
  }

  if (rejectState.status === "success") {
    return (
      <p className="text-sm font-medium text-danger">
        Quotation rejected. Your note has been sent.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={acceptAction}>
          <Button
            type="submit"
            variant="accent"
            size="md"
            disabled={acceptPending}
            className="h-11 min-w-[160px]"
          >
            {acceptPending ? "Accepting…" : "Accept Quotation"}
          </Button>
        </form>

        {!showRejectNote && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="h-11 border-[#8D3D2E] text-[#8D3D2E] hover:border-[#7b3124] hover:text-[#7b3124]"
            onClick={() => setShowRejectNote(true)}
          >
            Reject
          </Button>
        )}
      </div>

      {showRejectNote && (
        <form action={rejectAction} className="space-y-3">
          <div
            className="overflow-hidden transition-all duration-200 ease-out"
            style={{ maxHeight: showRejectNote ? "300px" : "0" }}
          >
            <Textarea
              name="rejectionReason"
              placeholder="Add a note for the sender (optional)"
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            variant="danger"
            size="md"
            disabled={rejectPending}
            className="h-11"
          >
            {rejectPending ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </form>
      )}

      {acceptState.status === "error" && (
        <p className="text-sm text-danger">
          Something went wrong. Please try again or contact the sender.
        </p>
      )}
      {rejectState.status === "error" && (
        <p className="text-sm text-danger">
          Something went wrong. Please try again or contact the sender.
        </p>
      )}
    </div>
  );
}
