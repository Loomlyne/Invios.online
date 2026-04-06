"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvoicePreviewData } from "@/lib/types";
import { cn } from "@/lib/utils";

const PREVIEW_WIDTH = 480;
const PREVIEW_CONTENT_WIDTH = PREVIEW_WIDTH - 40;
const PREVIEW_GAP = 16;
const RECIPIENT_ADDRESS_WIDTH = Math.round(((PREVIEW_CONTENT_WIDTH - PREVIEW_GAP) * 0.9) / 2);
const NOTES_PANEL_WIDTH = Math.round((PREVIEW_CONTENT_WIDTH - PREVIEW_GAP) * (1 / 1.78));
const BODY_FONT = '400 14px "DM Sans"';
const BODY_LINE_HEIGHT = 28;

type MetricSeverity = "ok" | "dense" | "risk";

type MetricDefinition = {
  key: "recipientAddress" | "notes" | "terms";
  label: string;
  value: string;
  width: number;
  idealLineCount: number;
  maxLineCount: number;
  emptyMessage: string;
  denseMessage: string;
  riskMessage: string;
};

type LayoutMetric = {
  key: MetricDefinition["key"];
  label: string;
  lineCount: number;
  height: number;
  width: number;
  severity: MetricSeverity;
  message: string;
};

export function DocumentLayoutDiagnostics({
  preview,
}: {
  preview: InvoicePreviewData;
}) {
  const deferredRecipientAddress = useDeferredValue(preview.recipientAddress ?? "");
  const deferredNotes = useDeferredValue(preview.notes);
  const deferredTerms = useDeferredValue(preview.terms);
  const [metrics, setMetrics] = useState<LayoutMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const metricDefinitions: MetricDefinition[] = [
      {
        key: "recipientAddress",
        label: "Recipient address",
        value: deferredRecipientAddress,
        width: RECIPIENT_ADDRESS_WIDTH,
        idealLineCount: 4,
        maxLineCount: 6,
        emptyMessage: "No recipient address yet. Add one before sharing the document.",
        denseMessage: "Address is getting dense. Prefer a compact multi-line postal block.",
        riskMessage: "Address is likely too long for the current recipient panel. Trim it or move extra detail elsewhere.",
      },
      {
        key: "notes",
        label: "Notes",
        value: deferredNotes,
        width: NOTES_PANEL_WIDTH,
        idealLineCount: 5,
        maxLineCount: 8,
        emptyMessage: "Notes are empty. Add delivery context only if the client needs it.",
        denseMessage: "Notes are starting to dominate the lower half of the document.",
        riskMessage: "Notes are likely too long for a comfortable single-page layout. Move detail into line items or a follow-up message.",
      },
      {
        key: "terms",
        label: "Terms",
        value: deferredTerms,
        width: NOTES_PANEL_WIDTH,
        idealLineCount: 5,
        maxLineCount: 8,
        emptyMessage: "Terms are empty. Add the minimum payment and scope language needed for this job.",
        denseMessage: "Terms are getting heavy. Keep only the clauses that must live on the document.",
        riskMessage: "Terms are likely too long for a comfortable single-page layout. Trim them or move the full policy to a separate attachment.",
      },
    ];

    async function measure() {
      try {
        setLoading(true);
        setFailed(false);

        const { prepare, layout } = await import("@chenglou/pretext");
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const nextMetrics = metricDefinitions.map((definition) => {
          const text = definition.value.trim();
          if (!text) {
            return {
              key: definition.key,
              label: definition.label,
              lineCount: 0,
              height: 0,
              width: definition.width,
              severity: "ok" as const,
              message: definition.emptyMessage,
            };
          }

          const prepared = prepare(definition.value, BODY_FONT, { whiteSpace: "pre-wrap" });
          const { lineCount, height } = layout(prepared, definition.width, BODY_LINE_HEIGHT);

          return {
            key: definition.key,
            label: definition.label,
            lineCount,
            height,
            width: definition.width,
            severity: classifySeverity(lineCount, definition.idealLineCount, definition.maxLineCount),
            message: classifyMessage(
              lineCount,
              definition.idealLineCount,
              definition.maxLineCount,
              definition.denseMessage,
              definition.riskMessage,
            ),
          };
        });

        if (!cancelled) {
          setMetrics(nextMetrics);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    }

    void measure();

    return () => {
      cancelled = true;
    };
  }, [deferredNotes, deferredRecipientAddress, deferredTerms]);

  const overallSeverity = getOverallSeverity(metrics);
  const overallLabel = getOverallLabel(overallSeverity);

  return (
    <Card className="border border-black/7 bg-[#FFFCF7] p-0 shadow-none">
      <CardHeader className="border-b border-black/6 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant={overallSeverity === "ok" ? "success" : "warning"}>Pretext fit check</Badge>
            <CardTitle className="mt-3 text-lg">Shared document text density</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              Measured at the same 480px document width used by the builder preview. These copy blocks also flow into the shared page and PDF export.
            </CardDescription>
          </div>
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
              overallSeverity === "ok"
                ? "border-emerald-900/15 bg-emerald-50 text-success"
                : overallSeverity === "dense"
                  ? "border-amber-700/20 bg-amber-50 text-amber-800"
                  : "border-[#E7B1A8] bg-[#FFF3F1] text-[#8D3D2E]",
            )}
          >
            {overallLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 px-5 py-5">
        {loading ? (
          <div className="rounded-[1rem] border border-black/7 bg-white px-4 py-4 text-sm text-muted">
            Measuring the current copy with Pretext.
          </div>
        ) : null}

        {failed ? (
          <div className="rounded-[1rem] border border-[#E7B1A8] bg-[#FFF3F1] px-4 py-4 text-sm text-[#8D3D2E]">
            Pretext could not finish the layout check in this browser session.
          </div>
        ) : null}

        {!loading && !failed
          ? metrics.map((metric) => (
              <div key={metric.key} className="rounded-[1rem] border border-black/7 bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                    <p className="mt-1 text-sm text-muted">
                      {metric.lineCount > 0
                        ? `${metric.lineCount} lines · ${metric.height}px tall · ${metric.width}px column`
                        : "No layout pressure yet"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      metric.severity === "ok"
                        ? "border-emerald-900/15 bg-emerald-50 text-success"
                        : metric.severity === "dense"
                          ? "border-amber-700/20 bg-amber-50 text-amber-800"
                          : "border-[#E7B1A8] bg-[#FFF3F1] text-[#8D3D2E]",
                    )}
                  >
                    {metric.severity === "ok" ? "Comfortable" : metric.severity === "dense" ? "Dense" : "Overflow risk"}
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-strong">{metric.message}</p>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}

function classifySeverity(
  lineCount: number,
  idealLineCount: number,
  maxLineCount: number,
): MetricSeverity {
  if (lineCount > maxLineCount) {
    return "risk";
  }

  if (lineCount > idealLineCount) {
    return "dense";
  }

  return "ok";
}

function classifyMessage(
  lineCount: number,
  idealLineCount: number,
  maxLineCount: number,
  denseMessage: string,
  riskMessage: string,
) {
  if (lineCount > maxLineCount) {
    return riskMessage;
  }

  if (lineCount > idealLineCount) {
    return denseMessage;
  }

  return "Copy fits comfortably inside the current document surface.";
}

function getOverallSeverity(metrics: LayoutMetric[]): MetricSeverity {
  if (metrics.some((metric) => metric.severity === "risk")) {
    return "risk";
  }

  if (metrics.some((metric) => metric.severity === "dense")) {
    return "dense";
  }

  return "ok";
}

function getOverallLabel(severity: MetricSeverity) {
  switch (severity) {
    case "risk":
      return "Trim copy";
    case "dense":
      return "Review copy";
    default:
      return "Fits well";
  }
}
