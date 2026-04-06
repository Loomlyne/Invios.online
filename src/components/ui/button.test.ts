import { describe, expect, it } from "vitest";
import { badgeVariants } from "./badge";
import { buttonVariants } from "./button";

describe("ui contrast variants", () => {
  it("keeps ghost buttons readable on light surfaces", () => {
    const classes = buttonVariants({ variant: "ghost" });

    expect(classes).toContain("text-foreground");
    expect(classes).toContain("hover:bg-black/5");
  });

  it("provides an inverse button variant for dark surfaces", () => {
    const classes = buttonVariants({ variant: "inverse" });

    expect(classes).toContain("text-[#FFF9F0]");
    expect(classes).toContain("bg-white/10");
  });

  it("uses a readable default badge on light and dark surfaces", () => {
    const classes = badgeVariants({ variant: "default" });

    expect(classes).toContain("text-foreground");
    expect(classes).toContain("bg-[#FFF7EA]");
  });
});
