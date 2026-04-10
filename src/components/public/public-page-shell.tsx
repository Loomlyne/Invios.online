import Image from "next/image";
import type { ReactNode } from "react";

interface PublicPageShellProps {
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  children: ReactNode;
}

export function PublicPageShell({
  businessName,
  logoUrl,
  primaryColor,
  children,
}: PublicPageShellProps) {
  const headerBg = primaryColor || "var(--accent)";

  return (
    <div className="min-h-screen bg-background">
      <header
        className="flex items-center justify-between px-6"
        style={{ backgroundColor: headerBg, height: "64px" }}
      >
        <div className="flex items-center gap-3">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={businessName}
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
            />
          )}
        </div>
        <span
          className="font-display text-[28px] font-semibold leading-[1.1] text-white"
          style={{ color: "white" }}
        >
          {businessName}
        </span>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-0">{children}</main>

      <footer className="py-6 text-center">
        <a
          href="https://invios.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted hover:underline"
        >
          Powered by Invios
        </a>
      </footer>
    </div>
  );
}
