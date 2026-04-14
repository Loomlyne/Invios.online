"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvImportWizard } from "./csv-import-wizard";

export function ImportCsvButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Import CSV
        <Upload className="size-4" />
      </Button>
      <CsvImportWizard open={open} onOpenChange={setOpen} />
    </>
  );
}
