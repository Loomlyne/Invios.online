import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF7] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-on-dark shadow-[0_18px_45px_rgba(28,25,23,0.18)] hover:-translate-y-0.5 hover:bg-[#2B2623]",
        secondary:
          "border border-border bg-surface text-foreground hover:border-[#CAB9A2] hover:bg-[#FFF7EA]",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:border-black/8 hover:bg-black/5 hover:text-foreground",
        inverse:
          "border border-white/12 bg-white/10 text-on-dark shadow-[0_16px_36px_rgba(12,10,9,0.18)] hover:border-white/16 hover:bg-white/16",
        accent:
          "bg-accent text-[#1C1917] shadow-[0_18px_45px_var(--accent-glow)] hover:-translate-y-0.5 hover:bg-accent-strong",
        danger:
          "bg-[#8D3D2E] text-white shadow-[0_18px_45px_rgba(141,61,46,0.22)] hover:bg-[#7b3124]",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-7 text-base",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
