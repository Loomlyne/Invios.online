"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.from(containerRef.current, {
        opacity: prefersReduced ? 1 : 0,
        y: prefersReduced ? 0 : 16,
        duration: prefersReduced ? 0 : 0.38,
        ease: "power3.out",
        clearProps: "opacity,transform",
      });
    },
    { scope: containerRef, dependencies: [pathname] },
  );

  return <div ref={containerRef}>{children}</div>;
}
