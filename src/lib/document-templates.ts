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
};

export const documentTemplates: DocumentTemplateConfig[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Warm studio layout with strong hierarchy and soft paper surfaces.",
    canvasClassName: "border-black/10 bg-[#fffdfa]",
    headerClassName: "border-b border-black/5 bg-[#FCF8F1]",
    headerSurfaceClassName: "rounded-[1.3rem] border border-black/5 bg-white",
    metaSurfaceClassName: "rounded-[1rem] bg-[#F9F6EE]",
    recipientSurfaceClassName: "rounded-[1rem] bg-[#F9F6EE]",
    tableHeadClassName: "bg-[#F9F6EE] text-muted",
    notesSurfaceClassName: "rounded-[1.3rem] border border-black/5 bg-white",
    totalsSurfaceClassName: "rounded-[1.3rem] border border-black/5 bg-[#1C1917] text-[#F8F4EE]",
    totalsMutedClassName: "text-[#DDD4C6]",
    signatureSurfaceClassName: "rounded-[1.2rem] border border-white/10 bg-white/5",
    footerSurfaceClassName: "rounded-[1.3rem] border border-black/5 bg-[#FCF8F1]",
    numberClassName: "display-text text-2xl font-semibold",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sharper contrast, boardroom framing, and premium dark-led summary panels.",
    canvasClassName: "border-black/12 bg-[#f6f1e7]",
    headerClassName: "border-b border-black/10 bg-[#17120F] text-[#FFF9F0]",
    headerSurfaceClassName: "rounded-[1.3rem] border border-black/8 bg-[#FFFDF8]",
    metaSurfaceClassName: "rounded-[1rem] border border-white/8 bg-white/10",
    recipientSurfaceClassName: "rounded-[1rem] border border-black/8 bg-[#F6EEE0]",
    tableHeadClassName: "bg-[#231C17] text-[#F4EBDD]",
    notesSurfaceClassName: "rounded-[1.3rem] border border-black/8 bg-[#FFFDF8]",
    totalsSurfaceClassName: "rounded-[1.3rem] border border-black/8 bg-[#120E0C] text-[#FFF9F0]",
    totalsMutedClassName: "text-[#E9DCC7]",
    signatureSurfaceClassName: "rounded-[1.2rem] border border-white/12 bg-white/6",
    footerSurfaceClassName: "rounded-[1.3rem] border border-black/8 bg-[#EFE5D5]",
    numberClassName: "display-text text-2xl font-semibold text-[#F2D088]",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet invoice sheet with restrained surfaces and editorial whitespace.",
    canvasClassName: "border-black/8 bg-white",
    headerClassName: "border-b border-black/8 bg-white",
    headerSurfaceClassName: "rounded-[1.1rem] border border-black/6 bg-[#FAF7F2]",
    metaSurfaceClassName: "rounded-[1rem] border border-black/6 bg-white",
    recipientSurfaceClassName: "rounded-[1rem] border border-black/6 bg-white",
    tableHeadClassName: "bg-[#F5F1EA] text-muted-strong",
    notesSurfaceClassName: "rounded-[1.1rem] border border-black/6 bg-[#FAF7F2]",
    totalsSurfaceClassName: "rounded-[1.1rem] border border-black/6 bg-[#17120F] text-[#FFF9F0]",
    totalsMutedClassName: "text-[#E2D7CA]",
    signatureSurfaceClassName: "rounded-[1rem] border border-white/10 bg-white/4",
    footerSurfaceClassName: "rounded-[1.1rem] border border-black/6 bg-[#F5F1EA]",
    numberClassName: "text-2xl font-semibold tracking-[-0.02em]",
  },
];

export function getDocumentTemplate(templateId?: string | null): DocumentTemplateConfig {
  return (
    documentTemplates.find((template) => template.id === templateId) ??
    documentTemplates[0]
  );
}
