/**
 * DebtSection — /gold/why#deficits
 *
 * The 10 largest economies (by GDP in US dollars) with government debt and the
 * annual deficit, both as % of GDP, from one consistent IMF release.
 * IMF reports the budget balance as "net lending/borrowing": negative = deficit.
 * We show it as "Deficit 7.5%" / "Surplus 1.2%" so readers don't have to decode signs.
 */

import type { FiscalTable } from "@/lib/data/gold-macro";
import { formatNumber } from "@/lib/format";
import { PageSection } from "@/components/ui/PageSection";
import { SourceNote } from "@/components/ui/SourceNote";

export function DebtSection({ data, updatedAt }: { data: FiscalTable | null; updatedAt?: string }) {
  const maxDebt = Math.max(100, ...(data?.rows.map((row) => row.debtPct ?? 0) ?? []));

  return (
    <PageSection
      id="deficits"
      title="Deficits and debt"
      intro="Governments of most large economies spend more than they collect, year after year. Persistent deficits push debt higher and test confidence in paper currencies; gold has no issuer and can't be printed."
    >
      {!data ? (
        <p className="text-sm text-muted">Fiscal data is unavailable right now.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <caption className="border-b border-border px-4 py-3 text-left">
              <span className="block font-semibold text-zinc-900 dark:text-zinc-50">
                Top 10 economies, {data.year}
                {data.isProjection ? " (IMF estimates)" : ""}
              </span>
              <span className="block text-xs text-muted">
                General government, % of GDP · IMF release: {data.vintage}
              </span>
            </caption>
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium">Country</th>
                <th className="px-4 py-2 text-right font-medium">GDP</th>
                <th className="w-2/5 px-4 py-2 text-left font-medium">Gross debt</th>
                <th className="px-4 py-2 text-right font-medium">vs 5 yrs ago</th>
                <th className="px-4 py-2 text-right font-medium">Annual balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map((row) => {
                const change = row.debtPct != null && row.debtPct5yAgo != null ? row.debtPct - row.debtPct5yAgo : null;
                return (
                  <tr key={row.iso3}>
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">
                      {row.gdpUsdBn == null ? "—" : `$${formatNumber(row.gdpUsdBn / 1000, 1)}T`}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-2 rounded-full bg-accent"
                            style={{ width: `${((row.debtPct ?? 0) / maxDebt) * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-right tabular-nums">
                          {row.debtPct == null ? "—" : `${formatNumber(row.debtPct, 1)}%`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">
                      {change == null ? "—" : `${change > 0 ? "+" : "−"}${formatNumber(Math.abs(change), 1)} pts`}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatBalance(row.balancePct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SourceNote
        sources={[
          {
            label: `International Monetary Fund, World Economic Outlook / Fiscal Monitor${data ? ` (${data.vintage})` : ""}, via IMF DataMapper`,
            href: "https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO",
          },
        ]}
        updatedAt={updatedAt}
      >
        <p>
          Ranked by GDP in current US dollars. &ldquo;Annual balance&rdquo; is the IMF&apos;s general
          government net lending/borrowing; a negative value is shown as a deficit.
        </p>
      </SourceNote>
    </PageSection>
  );
}

function formatBalance(value: number | null): string {
  if (value == null) return "—";
  if (Math.abs(value) < 0.05) return "Balanced";
  return `${value < 0 ? "Deficit" : "Surplus"} ${formatNumber(Math.abs(value), 1)}%`;
}
