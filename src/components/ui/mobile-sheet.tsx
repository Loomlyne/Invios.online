"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function MobileSheet({ open, onOpenChange, children }: MobileSheetProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer.Root>
  );
}

export function MobileSheetTrigger({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    // Trigger is wired via DialogTrigger — render children as-is (parent Dialog handles it)
    return <>{children}</>;
  }

  return <Drawer.Trigger asChild>{children}</Drawer.Trigger>;
}

interface MobileSheetContentProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function MobileSheetContent({ children, className, title }: MobileSheetContentProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DialogContent className={className}>{children}</DialogContent>;
  }

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-[#17120f]/50 backdrop-blur-sm" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-1rem)] flex-col rounded-t-[1.6rem] border border-black/8 bg-[#FFFDF9] outline-none",
          className,
        )}
        aria-label={title}
      >
        {/* Handle bar */}
        <div className="relative flex shrink-0 items-center justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-foreground/15" />
          <Drawer.Close
            aria-label="Close sheet"
            className="absolute right-4 top-2 flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            <X className="size-4" />
          </Drawer.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

export function MobileSheetHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}
