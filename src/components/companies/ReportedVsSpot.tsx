/**
 * ReportedVsSpot — one metric row: company assumption vs today's gold.
 * Used on Overview and mine cards so the price assumption never gets lost.
 */

import { EMPTY, formatPrice } from "@/lib/format";

type ReportedVsSpotProps = {
  label: string;
  /** Reported figure (e.g. AISC). */
  reported: number | null;
  reportedSuffix?: string;
  assumptionGold: number | null;
  assumptionMargin: number | null;
  spotGold: number | null;
  spotMargin: number | null;
  spotAsOf?: string | null;
};

export function ReportedVsSpot({
  label,
  reported,
  reportedSuffix = "/oz",
  assumptionGold,
  assumptionMargin,
  spotGold,
  spotMargin,
  spotAsOf,
}: ReportedVsSpotProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {reported != null ? `${formatPrice(reported, "USD", 0)}${reportedSuffix}` : EMPTY}
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">
            Margin @ assumption
            {assumptionGold != null ? ` (${formatPrice(assumptionGold, "USD", 0)})` : ""}
          </dt>
          <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
            {assumptionMargin != null ? formatPrice(assumptionMargin, "USD", 0) : EMPTY}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">
            Margin @ spot
            {spotGold != null ? ` (${formatPrice(spotGold, "USD", 0)})` : ""}
            {spotAsOf ? ` · ${spotAsOf}` : ""}
          </dt>
          <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
            {spotMargin != null ? formatPrice(spotMargin, "USD", 0) : EMPTY}
          </dd>
        </div>
      </dl>
    </div>
  );
}
