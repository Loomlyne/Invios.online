"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/documents/share-modal";

export function ShareButton({ publicPath }: { publicPath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="size-4" />
        Share
      </Button>
      <ShareModal publicPath={publicPath} open={open} onOpenChange={setOpen} />
    </>
  );
}
