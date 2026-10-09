/**
 * CentralBanksSection — /gold/why#central-banks
 *
 * Left: the 10 largest official gold holders (tonnes, share of reserves, 12-month change).
 * Right: the biggest buyers over the last 12 months, as horizontal bars.
 *
 * Data: IMF official reserves (scripts/fetch_imf_gold_reserves.py). Each country
 * reports on its own schedule, so the "As of" column can differ by row.
 */

import type { CentralBankData } from "@/lib/data/gold-macro";
import { changeTone, formatMonth, formatNumber, formatTonnesChange } from "@/lib/format";
import { PageSection } from "@/components/ui/PageSection";
import { SourceNote } from "@/components/ui/SourceNote";

export function CentralBanksSection({ data, updatedAt }: { data: CentralBankData | null; updatedAt?: string }) {
  return (
    <PageSection
      id="central-banks"
      title="Central bank buying"
      intro="Official holdings reported by each central bank to the IMF. Steady buying by reserve managers is price-insensitive demand that tends to persist."
    >
      {!data ? (
        <Unavailable />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="overflow-x-auto rounded-lg border border-border bg-surface lg:col-span-3">
            <table className="w-full text-sm">
              <caption className="border-b border-border px-4 py-3 text-left">
                <span className="block font-semibold text-zinc-900 dark:text-zinc-50">Largest holders</span>
                <span className="block text-xs text-muted">Tonnes of gold and its share of total reserves</span>
              </caption>
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium">Country</th>
                  <th className="px-4 py-2 text-right font-medium">Tonnes</th>
                  <th className="px-4 py-2 text-right font-medium">% of reserves</th>
                  <th className="px-4 py-2 text-right font-medium">12-mo change</th>
                  <th className="px-4 py-2 text-right font-medium">As of</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topHolders.map((row) => (
                  <tr key={row.iso3}>
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatNumber(row.tonnes, 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.pctOfReserves == null ? "—" : `${formatNumber(row.pctOfReserves, 1)}%`}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums ${changeTone(roundTonnes(row.change12m))}`}>
                      {formatTonnesChange(row.change12m)}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-muted">{formatMonth(row.period)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 lg:col-span-2">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Biggest buyers, last 12 months</p>
            <p className="text-xs text-muted">Tonnes added over the 12 months to each country&apos;s latest report</p>
            <BuyerBars buyers={data.topBuyers} />
          </div>
        </div>
      )}

      <SourceNote
        sources={[
          {
            label:
              "International Monetary Fund, International Reserves and Foreign Currency Liquidity (IRFCL)",
            href: "https://data.imf.org/",
          },
        ]}
        updatedAt={updatedAt}
      >
        <p>
          Transformations by ResourceBook: tonnes converted from fine troy ounces (1 t = 32,150.75 oz);
          gold revalued at each month&apos;s market price where a country books it at a historical price
          (e.g. the US at $42.22/oz); volumes reported 1,000× too large are corrected, and months
          where the reported volume and value contradict each other are left out.
        </p>
        <p>
          Further reading:{" "}
          <a
            href="https://www.gold.org/goldhub/data/gold-reserves-by-country"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-accent-fg"
          >
            World Gold Council, gold reserves by country
          </a>
        </p>
      </SourceNote>
    </PageSection>
  );
}

function BuyerBars({ buyers }: { buyers: CentralBankData["topBuyers"] }) {
  if (buyers.length === 0) return <p className="mt-4 text-sm text-muted">No net buyers reported.</p>;
  const max = buyers[0].change12m ?? 1;
  return (
    <ol className="mt-4 space-y-2.5">
      {buyers.map((buyer) => (
        <li key={buyer.iso3}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{buyer.name}</span>
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatTonnesChange(buyer.change12m)}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${((buyer.change12m ?? 0) / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Tiny moves (rounding, revaluation noise) count as "no change". */
function roundTonnes(value: number | null) {
  return value == null ? null : Math.round(value);
}

function Unavailable() {
  return <p className="text-sm text-muted">Reserve data is unavailable right now.</p>;
}
