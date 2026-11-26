/**
 * StructureCards — what "ETF", "physical trust", and "receipt" mean, shown
 * above the fund table. Only the structures present in the current market
 * are shown (Canada has receipts; the US list has none).
 */

import { VEHICLE_STRUCTURES, type VehicleStructure } from "@/content/gold";

export function StructureCards({ structures }: { structures: string[] }) {
  const present = (Object.keys(VEHICLE_STRUCTURES) as VehicleStructure[]).filter((key) =>
    structures.includes(key),
  );
  if (present.length === 0) return null;
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {present.map((key) => (
        <li key={key} className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{VEHICLE_STRUCTURES[key].label}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{VEHICLE_STRUCTURES[key].body}</p>
        </li>
      ))}
    </ul>
  );
}
