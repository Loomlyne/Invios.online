import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminComingSoon({
  title,
  description,
  wave,
}: {
  title: string;
  description: string;
  wave: string;
}) {
  return (
    <div className="grid gap-[var(--space-section)]">
      <div className="space-y-2">
        <Badge variant="accent">{wave}</Badge>
        <h1 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
          {title}
        </h1>
      </div>
      <div className="flex items-start gap-4 rounded-[var(--radius-card)] border border-black/8 bg-surface p-6 subtle-shadow">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <Construction className="size-5 text-accent" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">On the roadmap</p>
          <p className="max-w-xl text-sm leading-7 text-muted-strong">{description}</p>
        </div>
      </div>
    </div>
  );
}
