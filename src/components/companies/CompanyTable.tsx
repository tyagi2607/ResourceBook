/**
 * CompanyTable — mining comps screener (dual P/NAV first for producers).
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

function formatPnav(value: number | null): string {
  return value != null ? `${formatNumber(value, 2)}x` : EMPTY;
}

export function CompanyTable({
  companies,
  showTier,
  showProducerMetrics,
  showDeveloperMetrics,
}: {
  companies: CompanyRow[];
  showTier: boolean;
  showProducerMetrics: boolean;
  showDeveloperMetrics: boolean;
}) {
  const hasDualNav = companies.some((c) => c.pnavClose != null || c.pnavBaseline != null);

  const columns: Column[] = [
    { key: "ticker", label: "Ticker" },
    ...(showTier ? [{ key: "tier", label: "Tier" }] : []),
    ...(showProducerMetrics && hasDualNav
      ? [
          {
            key: "pnavBaseline",
            label: "P/NAV @ 3y",
            align: "right" as const,
            hint: COMPANY_COLUMN_HINTS.pnavBaseline,
          },
          {
            key: "pnavClose",
            label: "P/NAV @ close",
            align: "right" as const,
            hint: COMPANY_COLUMN_HINTS.pnavClose,
          },
        ]
      : []),
    ...(showProducerMetrics
      ? [
          { key: "aisc", label: "AISC", align: "right" as const, hint: COMPANY_COLUMN_HINTS.aisc },
          {
            key: "spotMargin",
            label: "Close margin",
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
    { key: "price", label: "Price", align: "right" as const },
    { key: "change", label: "1 day", align: "right" as const },
    { key: "mcap", label: "Market cap", align: "right" as const },
    ...(showDeveloperMetrics
      ? [
          { key: "stage", label: "Study" },
          { key: "jurisdiction", label: "Jurisdiction" },
        ]
      : [{ key: "jurisdiction", label: "Jurisdiction" }]),
  ];

  const rows: Row[] = companies.map((company) => {
    const provisional = company.navMethod === "company_proxy_v1";
    return {
      id: company.symbol,
      cells: {
        ticker: {
          text: company.ticker,
          sub: company.name,
          href: `/gold/companies/${encodeURIComponent(company.symbol)}`,
          sort: company.ticker,
        },
        tier: { text: TIER_LABEL[company.tier], sort: company.tier },
        pnavBaseline: {
          text: formatPnav(company.pnavBaseline),
          sub:
            company.navBaselineMusd != null && company.goldBaselineUsd != null
              ? `NAV $${formatNumber(company.navBaselineMusd / 1000, 1)}B @ ${formatPrice(company.goldBaselineUsd, "USD", 0)}`
              : undefined,
          sort: company.pnavBaseline,
        },
        pnavClose: {
          text: formatPnav(company.pnavClose),
          sub: provisional
            ? "Provisional proxy"
            : company.navCloseMusd != null && company.goldCloseUsd != null
              ? `NAV $${formatNumber(company.navCloseMusd / 1000, 1)}B @ ${formatPrice(company.goldCloseUsd, "USD", 0)}`
              : undefined,
          sort: company.pnavClose,
        },
        price: { text: formatPrice(company.price, company.currency), sort: company.price },
        change: {
          text: formatPercent(company.changePct),
          sort: company.changePct,
          tone:
            company.changePct == null || company.changePct === 0
              ? undefined
              : company.changePct > 0
                ? "up"
                : "down",
        },
        mcap: { text: formatCompactPrice(company.marketCap, company.currency), sort: company.marketCap },
        aisc: {
          text: company.aiscPerOz != null ? formatPrice(company.aiscPerOz, "USD", 0) : EMPTY,
          sub:
            company.aiscGoldPriceUsd != null
              ? `@ ${formatPrice(company.aiscGoldPriceUsd, "USD", 0)} filing`
              : undefined,
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
      },
    };
  });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      defaultSort={{
        key: showProducerMetrics && hasDualNav ? "pnavClose" : showProducerMetrics ? "aisc" : "mcap",
        direction: showProducerMetrics ? "asc" : "desc",
      }}
      caption="Gold companies"
    />
  );
}
