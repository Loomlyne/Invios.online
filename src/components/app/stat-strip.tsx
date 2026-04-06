import { Fragment } from "react";

export function StatStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 ? (
            <span className="text-muted/30" aria-hidden>
              ·
            </span>
          ) : null}
          <span>
            <span className="text-muted">{item.label}</span>{" "}
            <span className="font-semibold text-foreground">{item.value}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}
