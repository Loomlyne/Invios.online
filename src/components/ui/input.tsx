import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[1rem] border border-border bg-white/85 px-4 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:outline-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
