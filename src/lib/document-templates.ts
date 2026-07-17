export type DocumentTemplateConfig = {
  id: "minimal";
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

const documentTemplate: DocumentTemplateConfig = {
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
};

export function getDocumentTemplate(): DocumentTemplateConfig {
  return documentTemplate;
}
