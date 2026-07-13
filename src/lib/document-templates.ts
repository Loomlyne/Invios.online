export type DocumentTemplateConfig = {
  id: "classic";
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
};

export function getDocumentTemplate(): DocumentTemplateConfig {
  return documentTemplate;
}
