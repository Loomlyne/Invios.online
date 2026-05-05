"use client";

import { Check } from "lucide-react";
import { documentTemplates } from "@/lib/document-templates";
import type { DocumentTemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DocumentTemplatePicker({
  value,
  onChange,
  inputName,
}: {
  value: DocumentTemplateId;
  onChange: (value: DocumentTemplateId) => void;
  inputName: string;
}) {
  return (
    <div className="grid gap-3">
      <input type="hidden" name={inputName} value={value} />
      <div className="grid gap-3 md:grid-cols-3">
        {documentTemplates.map((template) => {
          const selected = template.id === value;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              className={cn(
                "rounded-[1.15rem] border px-4 py-4 text-left transition focus-visible:outline-none",
                selected
                  ? "border-[#2D251E] bg-[#17120F] text-[#FFF9F0] shadow-[0_20px_45px_rgba(23,18,15,0.18)]"
                  : "border-border bg-white text-foreground hover:border-[#CBB89D] hover:bg-[#FFF8EE]",
              )}
              data-template-option={template.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{template.name}</p>
                {selected ? <Check className="size-4 text-[#F2D088]" /> : null}
              </div>
              <p
                className={cn(
                  "mt-2 text-sm leading-6",
                  selected ? "text-[#E8DDD0]" : "text-muted-strong",
                )}
              >
                {template.description}
              </p>
              <div className="mt-4 grid gap-2">
                <div
                  className={cn(
                    "h-3 rounded-full",
                    template.id === "classic" && "bg-[linear-gradient(90deg,#f8f8f6_0%,#CA8A04_100%)]",
                    template.id === "executive" && "bg-[linear-gradient(90deg,#ffffff_0%,#78716C_100%)]",
                    template.id === "minimal" && "bg-[linear-gradient(90deg,#ffffff_0%,#e5e5e5_100%)]",
                  )}
                />
                <div className="grid grid-cols-[1.1fr_0.9fr] gap-2">
                  <div
                    className={cn(
                      "h-16 rounded-[0.9rem] border border-black/6",
                      template.id === "classic" && "bg-[#f8f8f6]",
                      template.id === "executive" && "bg-white border-b-2 border-b-black/12",
                      template.id === "minimal" && "bg-white",
                    )}
                  />
                  <div
                    className={cn(
                      "h-16 rounded-[0.9rem]",
                      template.id === "classic" && "bg-[#f5f5f3]",
                      template.id === "executive" && "bg-white border border-black/8",
                      template.id === "minimal" && "bg-[#fafafa] border border-black/4",
                    )}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
