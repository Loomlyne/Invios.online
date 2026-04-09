"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // key={pathname} causes React to remount this div on every navigation,
  // which re-triggers the CSS animation without any JS animation library.
  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}
