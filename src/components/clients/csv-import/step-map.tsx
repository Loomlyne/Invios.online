"use client";

import { useEffect, useId, useRef, useState } from "react";
import { autoMapHeaders, CSV_FIELDS, CSV_FIELD_LABELS } from "@/lib/csv-import";
import type { CsvField } from "@/lib/csv-import";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// StepMap — Props
// ---------------------------------------------------------------------------

interface StepMapProps {
  headers: string[];
  mapping: Partial<Record<CsvField, string>>;
  onMappingChange: (mapping: Partial<Record<CsvField, string>>) => void;
  onNext: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// StepMap
// ---------------------------------------------------------------------------

export function StepMap({
  headers,
  mapping,
  onMappingChange,
  onNext,
  onBack,
}: StepMapProps) {
  const baseId = useId();
  const [showNameRequired, setShowNameRequired] = useState(false);

  // Track which fields were auto-detected on mount
  const autoMappedRef = useRef<Partial<Record<CsvField, boolean>>>({});

  // On mount (or when headers change): auto-map if mapping is empty
  useEffect(() => {
    if (headers.length === 0) return;
    if (Object.keys(mapping).length === 0) {
      const detected = autoMapHeaders(headers);
      onMappingChange(detected);
      // Record which fields were auto-detected
      const autoFlags: Partial<Record<CsvField, boolean>> = {};
      for (const field of CSV_FIELDS) {
        if (detected[field]) autoFlags[field] = true;
      }
      autoMappedRef.current = autoFlags;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  // Build select options: all CSV headers + "Skip this field"
  const headerOptions = [
    { value: "", label: "Skip this field" },
    ...headers.map((h) => ({ value: h, label: h })),
  ];

  function handleFieldChange(field: CsvField, value: string) {
    const next = { ...mapping };
    if (value === "") {
      delete next[field];
    } else {
      next[field] = value;
    }
    onMappingChange(next);
    // If user manually selects a previously auto-detected field, clear auto flag
    if (autoMappedRef.current[field]) {
      autoMappedRef.current = { ...autoMappedRef.current, [field]: false };
    }
    // Clear name-required warning if name is now set
    if (field === "name" && value) {
      setShowNameRequired(false);
    }
  }

  function handleNext() {
    if (!mapping.name) {
      setShowNameRequired(true);
      return;
    }
    setShowNameRequired(false);
    onNext();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mapping grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CSV_FIELDS.map((field) => {
          const labelId = `${baseId}-label-${field}`;
          const selectId = `${baseId}-select-${field}`;
          const isAutoDetected = !!autoMappedRef.current[field];
          const currentValue = mapping[field] ?? "";

          return (
            <div key={field} className="flex flex-col gap-1.5">
              <Label id={labelId} htmlFor={selectId} className="text-sm font-semibold">
                {CSV_FIELD_LABELS[field]}
                {field === "name" && <span className="ml-0.5 text-danger"> *</span>}
              </Label>
              <Select
                id={selectId}
                options={headerOptions}
                value={currentValue}
                placeholder="Select column..."
                onChange={(value) => handleFieldChange(field, value)}
              />
              {isAutoDetected && currentValue && (
                <p className="text-xs text-muted">Auto-detected</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Name required hint */}
      {showNameRequired && (
        <p className="text-sm text-danger">Name is required to continue</p>
      )}

      {/* Footer */}
      <div className="mt-2 flex justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={handleNext}
          disabled={!mapping.name}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
