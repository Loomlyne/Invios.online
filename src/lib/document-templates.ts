import type { DocumentTemplateId } from "@/lib/types";

export type DocumentTemplateConfig = {
  id: DocumentTemplateId;
  name: string;
  description: string;
  canvasClassName: string;
  headerClassName: string;
  headerSurfaceClassName: string;
  metaSurfaceClassName: string;
  recipientSurfaceClassName: string;
  tableHeadClassName: string;
  notesSurfaceClassName: string;
  totalsSurfaceClassName: string;
  totalsMutedClassName: string;
  signatureSurfaceClassName: string;
  footerSurfaceClassName: string;
  numberClassName: string;
  /* ── layout flags ── */
  totalsStyle: "panel" | "rows";
  sectionDivider: "surface" | "line" | "none";
  headerVariant: "standard" | "two-row" | "editorial";
  metaVariant: "grid-3col" | "recipient-block" | "contact-grid";
  footerLayout: "stacked" | "side-by-side";
  hrClassName: string;
  totalsDividerClassName: string;
};

export const documentTemplates: DocumentTemplateConfig[] = [
  /* ────────────────────────── Classic (Pin Box) ────────────────────────── */
  {
    id: "classic",
    name: "Classic",
    description: "Clean professional layout with warm table hierarchy.",
    canvasClassName: "border-black/8 bg-white",
    headerClassName: "bg-white",
    headerSurfaceClassName: "",
    metaSurfaceClassName: "bg-[#f8f8f6]",
    recipientSurfaceClassName: "",
    tableHeadClassName: "bg-[#f5f5f3] text-[#78716C]",
    notesSurfaceClassName: "",
    totalsSurfaceClassName: "bg-transparent text-foreground",
    totalsMutedClassName: "text-[#78716C]",
    signatureSurfaceClassName: "",
    footerSurfaceClassName: "border-t border-black/8",
    numberClassName: "display-text text-3xl font-semibold",
    totalsStyle: "rows",
    sectionDivider: "surface",
    headerVariant: "standard",
    metaVariant: "grid-3col",
    footerLayout: "stacked",
    hrClassName: "border-black/8",
    totalsDividerClassName: "border-black/10",
  },
  /* ────────────────────────── Executive (Milan Vuckovic) ────────────────────────── */
  {
    id: "executive",
    name: "Executive",
    description: "Structured layout with line dividers and bold section labels.",
    canvasClassName: "border-black/8 bg-white",
    headerClassName: "bg-white",
    headerSurfaceClassName: "",
    metaSurfaceClassName: "",
    recipientSurfaceClassName: "",
    tableHeadClassName: "text-[#78716C] border-b border-black/12",
    notesSurfaceClassName: "",
    totalsSurfaceClassName: "bg-transparent text-foreground",
    totalsMutedClassName: "text-[#78716C]",
    signatureSurfaceClassName: "",
    footerSurfaceClassName: "border-t border-black/6",
    numberClassName: "text-xl font-bold uppercase tracking-wide",
    totalsStyle: "rows",
    sectionDivider: "line",
    headerVariant: "two-row",
    metaVariant: "recipient-block",
    footerLayout: "stacked",
    hrClassName: "border-black/10",
    totalsDividerClassName: "border-black/10",
  },
  /* ────────────────────────── Minimal (Artem Lebedev) ────────────────────────── */
  {
    id: "minimal",
    name: "Minimal",
    description: "Editorial whitespace with typography-driven hierarchy.",
    canvasClassName: "border-black/6 bg-white",
    headerClassName: "bg-white",
    headerSurfaceClassName: "",
    metaSurfaceClassName: "",
    recipientSurfaceClassName: "",
    tableHeadClassName: "text-[#78716C] border-b border-black/10",
    notesSurfaceClassName: "",
    totalsSurfaceClassName: "bg-transparent text-foreground",
    totalsMutedClassName: "text-[#78716C]",
    signatureSurfaceClassName: "",
    footerSurfaceClassName: "",
    numberClassName: "text-2xl font-bold uppercase tracking-tight",
    totalsStyle: "rows",
    sectionDivider: "none",
    headerVariant: "editorial",
    metaVariant: "contact-grid",
    footerLayout: "side-by-side",
    hrClassName: "",
    totalsDividerClassName: "border-black/8",
  },
];

export function getDocumentTemplate(templateId?: string | null): DocumentTemplateConfig {
  return (
    documentTemplates.find((template) => template.id === templateId) ??
    documentTemplates[0]
  );
}
