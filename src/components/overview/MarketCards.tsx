/**
 * MarketCards — two cards under the live TradingView quotes on /gold:
 *
 *  1. Gold futures (front month), LAST CLOSE. Free TradingView widgets block
 *     COMEX futures, so this comes from our daily Yahoo data (GC=F) and is
 *     labeled as the latest daily close, not a live price.
 *  2. Volume signal: is GLD (the largest gold ETF) trading busier than usual?
 *     Average volume over the last 5 sessions ÷ average over the last 252.
 */

import type { ReactNode } from "react";
import type { FuturesCard, VolumeCard, VolumeLevel } from "@/lib/data/gold-macro";
import { changeTone, formatDate, formatNumber, formatPercent, formatPrice } from "@/lib/format";

const LEVEL_TEXT: Record<VolumeLevel, { label: string; className: string }> = {
  above: { label: "Above normal", className: "bg-accent-soft text-accent-fg" },
  normal: { label: "Normal", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  quiet: { label: "Quiet", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

export function MarketCards({ futures, volume }: { futures: FuturesCard | null; volume: VolumeCard | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Gold futures (front month)" note="COMEX, latest daily close. Not live.">
        {futures ? (
          <>
            <p className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(futures.close)}
              </span>
              <span className={`text-sm font-medium tabular-nums ${changeTone(futures.changePct)}`}>
                {formatPercent(futures.changePct)}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              Close {formatDate(futures.asOfDate)} · Yahoo Finance (GC=F), delayed
            </p>
          </>
        ) : (
          <Unavailable />
        )}
      </Card>

      <Card
        title="Trading volume vs normal"
        note="GLD shares traded: last 5 sessions vs the past year (252 sessions)."
      >
        {volume ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {volume.ratio.toFixed(2)}×
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_TEXT[volume.level].className}`}>
                  {LEVEL_TEXT[volume.level].label}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatNumber(volume.recentAvg / 1e6, 1)}M/day vs {formatNumber(volume.yearAvg / 1e6, 1)}M/day ·
                to {formatDate(volume.asOfDate)} · Yahoo Finance
              </p>
            </div>
            <VolumeBars recent={volume.recent} yearAvg={volume.yearAvg} />
          </div>
        ) : (
          <Unavailable />
        )}
      </Card>
    </div>
  );
}

/** 30 thin bars (one per session) with a line at the 1-year average. */
function VolumeBars({ recent, yearAvg }: { recent: VolumeCard["recent"]; yearAvg: number }) {
  const max = Math.max(yearAvg, ...recent.map((day) => day.volume));
  const lastFive = recent.length - 5;
  return (
    <div className="relative flex h-12 w-32 shrink-0 items-end gap-px" aria-hidden="true">
      <div
        className="absolute inset-x-0 border-t border-dashed border-zinc-400 dark:border-zinc-500"
        style={{ bottom: `${(yearAvg / max) * 100}%` }}
      />
      {recent.map((day, index) => (
        <div
          key={day.date}
          title={`${day.date}: ${formatNumber(day.volume)}`}
          className={`flex-1 rounded-t-sm ${index >= lastFive ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"}`}
          style={{ height: `${Math.max((day.volume / max) * 100, 2)}%` }}
        />
      ))}
    </div>
  );
}

function Card({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Unavailable() {
  return <p className="text-sm text-muted">Data unavailable. It fills in after the daily price refresh.</p>;
}
