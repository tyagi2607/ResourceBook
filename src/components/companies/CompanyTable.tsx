/**
 * CompanyTable — sortable screener rows for one equity tier (or all).
 * Spot margin uses the latest gold futures close passed from the page.
 */

import { DataTable, type Column, type Row } from "@/components/ui/DataTable";
import { COMPANY_COLUMN_HINTS } from "@/content/gold";
import type { CompanyRow, CompanyTier } from "@/lib/data/gold-companies";
import { EMPTY, formatCompactPrice, formatNumber, formatPercent, formatPrice } from "@/lib/format";

const TIER_LABEL: Record<CompanyTier, string> = {
  royalty: "Royalty",
  producer: "Producer",
  developer: "Developer",
  explorer: "Explorer",
};

export function CompanyTable({
  companies,
  showTier,
  showProducerMetrics,
  showDeveloperMetrics,
  showNav,
}: {
  companies: CompanyRow[];
  showTier: boolean;
  showProducerMetrics: boolean;
  showDeveloperMetrics: boolean;
  showNav: boolean;
}) {
  const columns: Column[] = [
    { key: "ticker", label: "Ticker" },
    ...(showTier ? [{ key: "tier", label: "Tier" }] : []),
    { key: "price", label: "Price", align: "right" as const },
    { key: "change", label: "1 day", align: "right" as const },
    { key: "mcap", label: "Market cap", align: "right" as const },
    ...(showProducerMetrics
      ? [
          { key: "aisc", label: "AISC", align: "right" as const, hint: COMPANY_COLUMN_HINTS.aisc },
          {
            key: "spotMargin",
            label: "Spot margin",
            align: "right" as const,
            hint: COMPANY_COLUMN_HINTS.spotMargin,
          },
          { key: "production", label: "Prod. (koz)", align: "right" as const, hint: COMPANY_COLUMN_HINTS.production },
          { key: "reserves", label: "P&P (Moz)", align: "right" as const, hint: COMPANY_COLUMN_HINTS.reserves },
          {
            key: "life",
            label: "Reserve life",
            align: "right" as const,
            hint: COMPANY_COLUMN_HINTS.reserveLife,
          },
        ]
      : []),
    ...(showDeveloperMetrics
      ? [
          { key: "stage", label: "Study" },
          { key: "jurisdiction", label: "Jurisdiction" },
        ]
      : []),
    ...(showNav && companies.some((c) => c.navMusd != null)
      ? [
          { key: "nav", label: "NAV ($M)", align: "right" as const, hint: COMPANY_COLUMN_HINTS.nav },
          { key: "pnav", label: "P/NAV", align: "right" as const },
        ]
      : []),
    ...(!showDeveloperMetrics ? [{ key: "jurisdiction", label: "Jurisdiction" }] : []),
  ];

  const rows: Row[] = companies.map((company) => ({
    id: company.symbol,
    cells: {
      ticker: {
        text: company.ticker,
        sub: company.name,
        href: `/gold/companies/${encodeURIComponent(company.symbol)}`,
        sort: company.ticker,
      },
      tier: { text: TIER_LABEL[company.tier], sort: company.tier },
      price: { text: formatPrice(company.price, company.currency), sort: company.price },
      change: {
        text: formatPercent(company.changePct),
        sort: company.changePct,
        tone: company.changePct == null || company.changePct === 0 ? undefined : company.changePct > 0 ? "up" : "down",
      },
      mcap: { text: formatCompactPrice(company.marketCap, company.currency), sort: company.marketCap },
      aisc: {
        text: company.aiscPerOz != null ? formatPrice(company.aiscPerOz, "USD", 0) : EMPTY,
        sub: company.aiscGoldPriceUsd != null ? `@ ${formatPrice(company.aiscGoldPriceUsd, "USD", 0)} assumption` : undefined,
        sort: company.aiscPerOz,
      },
      spotMargin: {
        text: company.spotMargin != null ? formatPrice(company.spotMargin, "USD", 0) : EMPTY,
        sort: company.spotMargin,
        tone: company.spotMargin == null ? undefined : company.spotMargin > 0 ? "up" : "down",
      },
      production: {
        text: company.productionKoz != null ? formatNumber(company.productionKoz, 0) : EMPTY,
        sort: company.productionKoz,
      },
      reserves: {
        text: company.reservesMoz != null ? formatNumber(company.reservesMoz, 1) : EMPTY,
        sort: company.reservesMoz,
      },
      life: {
        text: company.reserveLife != null ? `${formatNumber(company.reserveLife, 1)} yr` : EMPTY,
        sort: company.reserveLife,
      },
      stage: { text: company.studyStage ?? EMPTY, sort: company.studyStage },
      jurisdiction: { text: company.jurisdictionRisk ?? EMPTY, sort: company.jurisdictionRisk },
      nav: {
        text: company.navMusd != null ? formatNumber(company.navMusd, 0) : EMPTY,
        sub: company.navGoldPriceUsd != null ? `@ ${formatPrice(company.navGoldPriceUsd, "USD", 0)} Au` : undefined,
        sort: company.navMusd,
      },
      pnav: {
        text: company.priceToNav != null ? `${formatNumber(company.priceToNav, 2)}x` : EMPTY,
        sort: company.priceToNav,
      },
    },
  }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      defaultSort={{ key: showProducerMetrics ? "aisc" : "mcap", direction: showProducerMetrics ? "asc" : "desc" }}
      caption="Gold companies"
    />
  );
}
