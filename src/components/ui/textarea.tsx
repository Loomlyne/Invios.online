import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[132px] w-full rounded-[1.2rem] border border-border bg-white/85 px-4 py-3 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:outline-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
