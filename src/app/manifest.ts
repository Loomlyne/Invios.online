import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invios",
    short_name: "Invios",
    description:
      "Premium invoicing and operator console for freelancers, consultants, and agencies.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f8f4ee",
    theme_color: "#1c1917",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
