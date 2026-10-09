/**
 * GeopoliticsSection — /gold/why#geopolitics
 *
 * Three "channels" through which geopolitics supports gold (editorial text with
 * citations, from src/content/gold.ts), then "proof in the data": countries whose
 * live official holdings come from the reserves table, so the numbers stay current
 * without anyone editing the text.
 */

import { GEOPOLITICS_PROOF, GEOPOLITICS_REVIEWED_ON, GOLD_GEOPOLITICS } from "@/content/gold";
import type { CentralBankData } from "@/lib/data/gold-macro";
import { formatDate, formatMonth, formatNumber, formatTonnesChange } from "@/lib/format";
import { PageSection } from "@/components/ui/PageSection";

export function GeopoliticsSection({ reserves }: { reserves: CentralBankData | null }) {
  return (
    <PageSection
      id="geopolitics"
      title="Geopolitical risk"
      intro="Gold has historically been sought during conflict, sanctions, and financial stress. Three channels explain why, and central bank behavior shows it in the data."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {GOLD_GEOPOLITICS.map((channel) => (
          <li key={channel.title} className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{channel.title}</h3>
            <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{channel.body}</p>
            <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted">
              {channel.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener"
                    className="underline underline-offset-2 hover:text-accent-fg"
                  >
                    {source.label}
                  </a>
                  {source.asOf && <> ({source.asOf})</>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-accent-fg">Proof in the data</h3>
      <ul className="mt-3 grid gap-4 md:grid-cols-2">
        {GEOPOLITICS_PROOF.map((country) => {
          const holding = reserves?.byCountry[country.iso3];
          return (
            <li key={country.iso3} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{country.title}</h4>
                {holding && (
                  <span className="text-right text-xs text-muted">IMF data, {formatMonth(holding.period)}</span>
                )}
              </div>
              {holding ? (
                <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  <Stat label="Official gold" value={`${formatNumber(holding.tonnes, 0)} t`} />
                  <Stat label="Last 12 months" value={formatTonnesChange(holding.change12m)} />
                  {holding.pctOfReserves != null && (
                    <Stat label="Share of reserves" value={`${formatNumber(holding.pctOfReserves, 1)}%`} />
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">Live holdings unavailable.</p>
              )}
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{country.body}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Text reviewed {formatDate(GEOPOLITICS_REVIEWED_ON)}.</p>
    </PageSection>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-xl font-semibold tabular-nums text-accent-fg">{value}</span>
      <span className="block text-xs text-muted">{label}</span>
    </span>
  );
}
