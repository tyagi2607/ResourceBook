/**
 * DriverStrip — the four "Why gold" drivers on /gold, one live number each.
 *
 * Each tile links to its full section on /gold/why (tables, charts, sources).
 * The numbers are computed by the page from the database; this component only
 * lays them out. A missing number shows "—" rather than hiding the tile.
 */

import Link from "next/link";
import type { DriverId, ThesisCard } from "@/content/gold";
import { EMPTY } from "@/lib/format";

export type DriverMetric = { value: string; caption: string };

type DriverStripProps = {
  drivers: ThesisCard[];
  metrics: Partial<Record<DriverId, DriverMetric>>;
};

export function DriverStrip({ drivers, metrics }: DriverStripProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {drivers.map((driver) => {
        const metric = metrics[driver.id];
        return (
          <li key={driver.id}>
            <Link
              href={`/gold/why#${driver.id}`}
              className="group flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition hover:border-accent-border"
            >
              <span className="text-sm font-semibold text-zinc-900 group-hover:text-accent-fg dark:text-zinc-50">
                {driver.title}
              </span>
              <span className="mt-3 text-2xl font-semibold tabular-nums text-accent-fg">
                {metric?.value ?? EMPTY}
              </span>
              <span className="mt-1 flex-1 text-xs text-muted">{metric?.caption ?? "Data unavailable"}</span>
              <span className="mt-3 text-xs font-medium text-accent-fg">Explore the data →</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
