/**
 * MinerEtfTable — gold miner ETFs (sector beta), not physical-metal funds.
 */

import { DataTable, type Column, type Row } from "@/components/ui/DataTable";
import type { MinerEtfRow } from "@/lib/data/gold-companies";
import { formatCompactPrice, formatFractionPercent, formatPercent, formatPrice } from "@/lib/format";

export function MinerEtfTable({ funds }: { funds: MinerEtfRow[] }) {
  const columns: Column[] = [
    { key: "ticker", label: "Ticker" },
    { key: "focus", label: "Focus" },
    { key: "price", label: "Price", align: "right" },
    { key: "change", label: "1 day", align: "right" },
    { key: "aum", label: "Assets", align: "right" },
    { key: "fee", label: "Fee / yr", align: "right" },
    { key: "holdings", label: "Holdings", sortable: false },
  ];

  const rows: Row[] = funds.map((fund) => ({
    id: fund.symbol,
    cells: {
      ticker: {
        text: fund.ticker,
        sub: fund.issuer ? `${fund.name} · ${fund.issuer}` : fund.name,
        href: fund.website ?? undefined,
        sort: fund.ticker,
      },
      focus: { text: fund.focus, sub: fund.exchange, sort: fund.focus },
      price: { text: formatPrice(fund.price, fund.currency), sort: fund.price },
      change: {
        text: formatPercent(fund.changePct),
        sort: fund.changePct,
        tone: fund.changePct == null || fund.changePct === 0 ? undefined : fund.changePct > 0 ? "up" : "down",
      },
      aum: { text: formatCompactPrice(fund.aum, fund.currency), sort: fund.aum },
      fee: { text: formatFractionPercent(fund.expenseRatio), sort: fund.expenseRatio },
      holdings: { text: fund.holdingsSummary ?? "—", sort: fund.holdingsSummary },
    },
  }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      defaultSort={{ key: "aum", direction: "desc" }}
      caption="Gold miner ETFs"
    />
  );
}
