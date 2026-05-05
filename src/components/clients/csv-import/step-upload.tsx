"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_IMPORT_ROWS } from "@/lib/csv-import";

// ---------------------------------------------------------------------------
// Template CSV download
// ---------------------------------------------------------------------------

function downloadTemplate() {
  const headers = "name,company,email,phone,address,trn";
  const example = `Acme Corp,Acme LLC,info@acme.com,+971501234567,"Dubai, UAE",100123456789012`;
  const csv = `${headers}\n${example}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "invios-clients-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// StepUpload — Props
// ---------------------------------------------------------------------------

interface StepUploadProps {
  onParsed: (rows: Record<string, string>[], headers: string[]) => void;
  onNext: () => void;
  onClose: () => void;
  hasParsedData: boolean;
  rowCount: number;
}

// ---------------------------------------------------------------------------
// StepUpload
// ---------------------------------------------------------------------------

export function StepUpload({
  onParsed,
  onNext,
  onClose,
  hasParsedData,
  rowCount,
}: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overCapWarning, setOverCapWarning] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileReaderRef = useRef<FileReader | null>(null);

  // Abort FileReader on unmount
  useEffect(() => {
    return () => {
      fileReaderRef.current?.abort();
    };
  }, []);

  function parseFile(file: File) {
    setParseError(null);
    setOverCapWarning(null);
    setFileName(file.name);

    const reader = new FileReader();
    fileReaderRef.current = reader;

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        setParseError("Could not read this file — check the format and try again.");
        return;
      }

      const totalRows = result.data.length;
      const headers = result.meta.fields ?? [];
      let rows = result.data;

      if (totalRows > MAX_IMPORT_ROWS) {
        setOverCapWarning(totalRows);
        rows = rows.slice(0, MAX_IMPORT_ROWS);
      }

      onParsed(rows, headers);
    };

    reader.onerror = () => {
      setParseError("Could not read this file — check the format and try again.");
    };

    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    // Reset input value so the same file can be re-selected
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-describedby="drop-zone-desc"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed transition-colors",
          isDragging
            ? "border-accent bg-accent/5"
            : hasParsedData
              ? "border-border-brand bg-surface"
              : "border-border bg-surface-subtle",
        )}
      >
        <FileText className="size-8 text-muted" />
        <p id="drop-zone-desc" className="text-sm text-muted">
          {fileName
            ? fileName
            : "Drop your CSV here, or click to browse"}
        </p>
        {hasParsedData && rowCount > 0 && !overCapWarning && (
          <p className="text-xs text-muted">
            {rowCount} {rowCount === 1 ? "row" : "rows"} loaded
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        aria-label="Upload CSV file"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Over-cap warning */}
      {overCapWarning !== null && (
        <div className="rounded-[var(--radius-md)] border border-amber-700/20 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          This file contains {overCapWarning} rows — only the first {MAX_IMPORT_ROWS} will be imported. Split your data into batches.
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <p className="text-sm text-danger">{parseError}</p>
      )}

      {/* Template download */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={downloadTemplate}
          className="gap-1.5"
        >
          <Download className="size-4" />
          Download template
        </Button>
      </div>

      {/* Footer actions */}
      <div className="mt-2 flex justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Close import wizard"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          disabled={!hasParsedData}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
