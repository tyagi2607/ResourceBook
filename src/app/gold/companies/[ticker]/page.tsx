/**
 * =============================================================================
 * Company detail — `/gold/companies/[ticker]`
 * =============================================================================
 *
 * Shared shell for all Lassonde tiers. Overview / Valuation / Assets metrics
 * swap by tier. Producers show dual after-tax P/NAV (3y avg vs gold close).
 *
 * docs/11-gold-companies.md
 */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { DetailTabs } from "@/components/companies/DetailTabs";
import { ReportedVsSpot } from "@/components/companies/ReportedVsSpot";
import {
  ASSETS_TAB_LABEL,
  MINE_STATUS_LABELS,
  REPORTED_VS_SPOT_NOTE,
  ROLE_LABELS,
  SOURCE_KIND_LABELS,
  VALUATION_METHOD_NOTE,
} from "@/content/gold";
import {
  getCompanyDetail,
  parseDetailTab,
  tradingViewEquitySymbol,
  type CompanyDetail,
  type CompanyRow,
} from "@/lib/data/gold-companies";
import {
  EMPTY,
  formatCompactPrice,
  formatDate,
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";

type PageProps = {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const symbol = decodeURIComponent((await params).ticker);
  const detail = await getCompanyDetail(symbol);
  if (!detail) return { title: "Company" };
  return {
    title: `${detail.company.ticker} — ${detail.company.name}`,
    description: `${detail.company.name}: dual P/NAV, mines, management, and filing sources.`,
  };
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const symbol = decodeURIComponent((await params).ticker);
  const tab = parseDetailTab((await searchParams).tab);
  const detail = await getCompanyDetail(symbol);
  if (!detail) notFound();

  const { company } = detail;
  const tvSymbol = tradingViewEquitySymbol(company.exchange, company.ticker);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-4">
        <p className="text-sm">
          <Link href="/gold/companies" className="text-muted hover:text-accent-fg">
            ← Companies
          </Link>
        </p>
        <HubPageHeader
          slug="gold"
          eyebrow={`${company.tier} · ${company.exchange}`}
          title={`${company.ticker} — ${company.name}`}
          intro={
            <p>
              {company.price != null && (
                <>
                  {formatPrice(company.price, company.currency)}{" "}
                  <span className="text-muted">
                    ({formatPercent(company.changePct)} · {company.country} listing)
                  </span>
                </>
              )}
              {company.website && (
                <>
                  {" · "}
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener"
                    className="underline underline-offset-2 hover:text-accent-fg"
                  >
                    Company website
                  </a>
                </>
              )}
            </p>
          }
        />
        <DetailTabs symbol={company.symbol} current={tab} tier={company.tier} />
        <TradingViewChart symbol={tvSymbol} height={360} range="12M" />
      </div>

      {tab === "overview" && <OverviewPanel detail={detail} />}
      {tab === "valuation" && <ValuationPanel detail={detail} />}
      {tab === "management" && <ManagementPanel detail={detail} />}
      {tab === "mines" && <MinesPanel detail={detail} />}
      {tab === "sources" && <SourcesPanel detail={detail} />}
    </div>
  );
}

function OverviewPanel({ detail }: { detail: CompanyDetail }) {
  const { company, rollup } = detail;
  return (
    <div className="space-y-8">
      <HeroStrip company={company} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewMetricCards(company).map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {company.tier === "producer" && company.aiscPerOz != null && (
        <ReportedVsSpot
          label="Consolidated AISC"
          reported={company.aiscPerOz}
          assumptionGold={company.aiscGoldPriceUsd}
          assumptionMargin={company.assumptionMargin}
          spotGold={detail.spot?.price ?? company.goldCloseUsd}
          spotMargin={company.spotMargin}
          spotAsOf={
            detail.spot ? formatDate(detail.spot.asOf) : company.navComputedAsOf
              ? formatDate(company.navComputedAsOf)
              : null
          }
        />
      )}

      {company.tier === "producer" && (company.navCloseMusd != null || company.navBaselineMusd != null) && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">NAV bridge @ close</p>
          <p className="mt-1 text-muted">
            Ops NPV {fmtMusd(detail.valuation.opsNpvCloseMusd)}
            {" + cash "}
            {fmtMusd(company.cashMusd)}
            {" − debt "}
            {fmtMusd(company.debtMusd)}
            {" = NAV "}
            {fmtMusd(company.navCloseMusd)}
            {company.navMethod && (
              <span className="ml-2 text-xs">({company.navMethod.replaceAll("_", " ")})</span>
            )}
          </p>
        </div>
      )}

      {detail.mines.length > 0 && company.tier === "producer" && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mine rollup (check)</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted">Attrib. production (koz)</dt>
              <dd className="font-medium tabular-nums">
                {rollup.attributableProductionKoz != null
                  ? formatNumber(rollup.attributableProductionKoz, 0)
                  : EMPTY}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Attrib. P&P (Moz)</dt>
              <dd className="font-medium tabular-nums">
                {rollup.attributableReservesMoz != null
                  ? formatNumber(rollup.attributableReservesMoz, 1)
                  : EMPTY}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Weighted mine AISC</dt>
              <dd className="font-medium tabular-nums">
                {rollup.weightedAisc != null ? formatPrice(rollup.weightedAisc, "USD", 0) : EMPTY}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {company.tier === "producer" && <p className="text-xs text-muted">{REPORTED_VS_SPOT_NOTE}</p>}
      {company.fundamentalsAsOf && (
        <p className="text-xs text-muted">
          Fundamentals as of {formatDate(company.fundamentalsAsOf)}
          {company.fundamentalsSource ? ` · ${company.fundamentalsSource}` : ""}
        </p>
      )}
    </div>
  );
}

function HeroStrip({ company }: { company: CompanyRow }) {
  if (company.tier === "producer" && (company.pnavBaseline != null || company.pnavClose != null)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="P/NAV @ 3y avg"
          value={company.pnavBaseline != null ? `${formatNumber(company.pnavBaseline, 2)}x` : EMPTY}
          hint={
            company.goldBaselineUsd != null && company.navBaselineMusd != null
              ? `NAV ${fmtMusd(company.navBaselineMusd)} @ ${formatPrice(company.goldBaselineUsd, "USD", 0)} Au`
              : undefined
          }
          emphasize
        />
        <MetricCard
          label="P/NAV @ close"
          value={company.pnavClose != null ? `${formatNumber(company.pnavClose, 2)}x` : EMPTY}
          hint={
            [
              company.goldCloseUsd != null && company.navCloseMusd != null
                ? `NAV ${fmtMusd(company.navCloseMusd)} @ ${formatPrice(company.goldCloseUsd, "USD", 0)} Au`
                : null,
              company.navMethod === "company_proxy_v1" ? "Provisional company proxy" : null,
              company.navComputedAsOf ? `as of ${formatDate(company.navComputedAsOf)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          emphasize
        />
      </div>
    );
  }

  if (company.tier === "developer" && company.npv5PctMusd != null) {
    const pNpv =
      company.marketCap != null && company.npv5PctMusd > 0
        ? company.marketCap / 1e6 / company.npv5PctMusd
        : null;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="P/NPV (study)"
          value={pNpv != null ? `${formatNumber(pNpv, 2)}x` : EMPTY}
          hint={`Study NPV ${fmtMusd(company.npv5PctMusd)}`}
          emphasize
        />
        <MetricCard
          label="Study stage"
          value={company.studyStage ?? EMPTY}
          hint={company.primaryAsset ?? undefined}
          emphasize
        />
      </div>
    );
  }

  if (company.tier === "explorer") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Cash"
          value={company.cashMusd != null ? fmtMusd(company.cashMusd) : EMPTY}
          hint={
            company.cashRunwayMonths != null
              ? `~${formatNumber(company.cashRunwayMonths, 0)} months runway`
              : undefined
          }
          emphasize
        />
        <MetricCard
          label="Latest assay"
          value={company.latestAssay ?? EMPTY}
          hint={company.primaryAsset ?? undefined}
          emphasize
        />
      </div>
    );
  }

  // Royalty / fallback
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard
        label="Market cap"
        value={
          company.marketCap != null ? formatCompactPrice(company.marketCap, company.currency) : EMPTY
        }
        emphasize
      />
      <MetricCard
        label="Net cash"
        value={
          company.cashMusd != null || company.debtMusd != null
            ? fmtMusd((company.cashMusd ?? 0) - (company.debtMusd ?? 0))
            : EMPTY
        }
        hint="Royalty NAV model not in v1"
        emphasize
      />
    </div>
  );
}

function overviewMetricCards(company: CompanyRow): { label: string; value: string; hint?: string }[] {
  if (company.tier === "producer") {
    return [
      {
        label: "Production (koz)",
        value: company.productionKoz != null ? formatNumber(company.productionKoz, 0) : EMPTY,
      },
      {
        label: "P&P reserves (Moz)",
        value: company.reservesMoz != null ? formatNumber(company.reservesMoz, 1) : EMPTY,
      },
      {
        label: "Reserve life",
        value: company.reserveLife != null ? `${formatNumber(company.reserveLife, 1)} yr` : EMPTY,
      },
      {
        label: "AISC",
        value: company.aiscPerOz != null ? formatPrice(company.aiscPerOz, "USD", 0) : EMPTY,
        hint:
          company.spotMargin != null
            ? `Close margin ${formatPrice(company.spotMargin, "USD", 0)}`
            : undefined,
      },
    ];
  }
  if (company.tier === "developer") {
    return [
      {
        label: "Study NPV ($M)",
        value: company.npv5PctMusd != null ? formatNumber(company.npv5PctMusd, 0) : EMPTY,
      },
      {
        label: "IRR",
        value: company.irrPct != null ? `${formatNumber(company.irrPct, 1)}%` : EMPTY,
      },
      {
        label: "Initial capex ($M)",
        value: company.initialCapexMusd != null ? formatNumber(company.initialCapexMusd, 0) : EMPTY,
      },
      {
        label: "Primary asset",
        value: company.primaryAsset ?? EMPTY,
        hint: company.jurisdictionRisk ?? undefined,
      },
    ];
  }
  if (company.tier === "explorer") {
    return [
      {
        label: "Cash ($M)",
        value: company.cashMusd != null ? formatNumber(company.cashMusd, 0) : EMPTY,
      },
      {
        label: "Runway (months)",
        value: company.cashRunwayMonths != null ? formatNumber(company.cashRunwayMonths, 0) : EMPTY,
      },
      { label: "Latest assay", value: company.latestAssay ?? EMPTY },
      {
        label: "Primary asset",
        value: company.primaryAsset ?? EMPTY,
        hint: company.jurisdictionRisk ?? undefined,
      },
    ];
  }
  // royalty
  return [
    { label: "GEO / gold eq.", value: EMPTY, hint: "Not seeded yet" },
    { label: "Portfolio", value: company.primaryAsset ?? EMPTY },
    {
      label: "Cash ($M)",
      value: company.cashMusd != null ? formatNumber(company.cashMusd, 0) : EMPTY,
    },
    {
      label: "Debt ($M)",
      value: company.debtMusd != null ? formatNumber(company.debtMusd, 0) : EMPTY,
    },
  ];
}

function ValuationPanel({ detail }: { detail: CompanyDetail }) {
  const { company, valuation } = detail;

  if (company.tier === "producer") {
    if (company.navCloseMusd == null && company.navBaselineMusd == null) {
      return (
        <p className="text-sm text-muted">
          No NAV yet. Need production, AISC, reserves (and cash/debt) — or mine DCF inputs — then run
          compute_company_nav after Yahoo ETL.
        </p>
      );
    }
    const taxPct = ((company.taxRate ?? 0.3) * 100).toFixed(0);
    const discPct = ((company.discountRate ?? 0.05) * 100).toFixed(0);
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Deck</th>
                <th className="px-4 py-3 text-right">Gold</th>
                <th className="px-4 py-3 text-right">Ops NPV</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">Debt</th>
                <th className="px-4 py-3 text-right">NAV</th>
                <th className="px-4 py-3 text-right">NAV/sh</th>
                <th className="px-4 py-3 text-right">P/NAV</th>
              </tr>
            </thead>
            <tbody>
              <ValuationRow
                label="3y avg"
                gold={company.goldBaselineUsd}
                ops={valuation.opsNpvBaselineMusd}
                cash={company.cashMusd}
                debt={company.debtMusd}
                nav={company.navBaselineMusd}
                shares={company.sharesOutstandingM}
                pnav={company.pnavBaseline}
              />
              <ValuationRow
                label="Close"
                gold={company.goldCloseUsd}
                ops={valuation.opsNpvCloseMusd}
                cash={company.cashMusd}
                debt={company.debtMusd}
                nav={company.navCloseMusd}
                shares={company.sharesOutstandingM}
                pnav={company.pnavClose}
              />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          {VALUATION_METHOD_NOTE} Discount {discPct}% · tax {taxPct}%
          {company.navMethod ? ` · method ${company.navMethod}` : ""}.
        </p>
      </div>
    );
  }

  if (company.tier === "developer") {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Study NPV ($M)"
            value={company.npv5PctMusd != null ? formatNumber(company.npv5PctMusd, 0) : EMPTY}
          />
          <MetricCard
            label="IRR"
            value={company.irrPct != null ? `${formatNumber(company.irrPct, 1)}%` : EMPTY}
          />
          <MetricCard
            label="Initial capex ($M)"
            value={company.initialCapexMusd != null ? formatNumber(company.initialCapexMusd, 0) : EMPTY}
          />
        </div>
        <p className="text-xs text-muted">Study economics from filings when seeded — not the mine DCF engine.</p>
      </div>
    );
  }

  if (company.tier === "explorer") {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Cash ($M)"
            value={company.cashMusd != null ? formatNumber(company.cashMusd, 0) : EMPTY}
          />
          <MetricCard
            label="Runway (months)"
            value={company.cashRunwayMonths != null ? formatNumber(company.cashRunwayMonths, 0) : EMPTY}
          />
        </div>
        <p className="text-xs text-muted">Explorers have no producing-asset DCF in v1.</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted">
      Royalty / streaming NAV model is not in v1 — market data only. Cash and debt show when seeded.
    </p>
  );
}

function ValuationRow({
  label,
  gold,
  ops,
  cash,
  debt,
  nav,
  shares,
  pnav,
}: {
  label: string;
  gold: number | null;
  ops: number | null;
  cash: number | null;
  debt: number | null;
  nav: number | null;
  shares: number | null;
  pnav: number | null;
}) {
  const navShare = nav != null && shares != null && shares > 0 ? nav / shares : null;
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 font-medium">{label}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {gold != null ? formatPrice(gold, "USD", 0) : EMPTY}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtMusd(ops)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtMusd(cash)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtMusd(debt)}</td>
      <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtMusd(nav)}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {navShare != null ? formatPrice(navShare, "USD", 2) : EMPTY}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-medium">
        {pnav != null ? `${formatNumber(pnav, 2)}x` : EMPTY}
      </td>
    </tr>
  );
}

function ManagementPanel({ detail }: { detail: CompanyDetail }) {
  if (detail.people.length === 0) {
    return <p className="text-sm text-muted">No management rows entered yet for this company.</p>;
  }
  return (
    <ul className="space-y-3">
      {detail.people.map((person) => (
        <li key={`${person.role}-${person.name}`} className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {ROLE_LABELS[person.role] ?? person.role}
          </p>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{person.name}</p>
          {person.sinceYear != null && <p className="text-sm text-muted">Since {person.sinceYear}</p>}
          {person.notes && <p className="mt-1 text-sm text-muted">{person.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

function MinesPanel({ detail }: { detail: CompanyDetail }) {
  const { company, mines } = detail;
  const assetsLabel = ASSETS_TAB_LABEL[company.tier] ?? "Mines";

  if (company.tier !== "producer") {
    return (
      <div className="space-y-4">
        <MetricCard
          label={assetsLabel}
          value={company.primaryAsset ?? EMPTY}
          hint={company.jurisdictionRisk ?? "Asset breakout not modeled in v1"}
        />
        <p className="text-sm text-muted">
          Detailed {assetsLabel.toLowerCase()} rows are not loaded for this tier yet.
        </p>
      </div>
    );
  }

  if (mines.length === 0) {
    return (
      <p className="text-sm text-muted">
        {company.navMethod === "company_proxy_v1"
          ? "Company-level proxy — mine breakout not loaded. NAV uses consolidated production, AISC, and reserves."
          : "No mines entered yet. Add rows in data/seed/company_mines.csv."}
      </p>
    );
  }

  const totalNpvClose = mines.reduce((sum, m) => sum + (m.npvCloseMusd ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Company consolidated</p>
        <p className="mt-1 text-muted">
          AISC {company.aiscPerOz != null ? formatPrice(company.aiscPerOz, "USD", 0) : EMPTY}
          {" · "}
          Production {company.productionKoz != null ? formatNumber(company.productionKoz, 0) : EMPTY} koz
          {" · "}
          Blank mine AISC uses company AISC
        </p>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {mines.map((mine) => {
          const share =
            mine.npvCloseMusd != null && totalNpvClose > 0
              ? (mine.npvCloseMusd / totalNpvClose) * 100
              : null;
          return (
            <li key={mine.mineSlug} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{mine.name}</h3>
                  <p className="text-xs text-muted">
                    {[mine.region, mine.country].filter(Boolean).join(", ")}
                    {" · "}
                    {MINE_STATUS_LABELS[mine.status] ?? mine.status}
                    {" · "}
                    {formatNumber(mine.ownershipPct, 0)}% owned
                  </p>
                </div>
                {mine.sourceUrl && (
                  <a
                    href={mine.sourceUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-accent-fg underline underline-offset-2"
                  >
                    Source
                  </a>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted">Production (koz)</dt>
                  <dd className="tabular-nums font-medium">
                    {mine.productionKoz != null ? formatNumber(mine.productionKoz, 0) : EMPTY}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Recoverable (koz)</dt>
                  <dd className="tabular-nums font-medium">
                    {mine.recoverableReservesKoz != null
                      ? formatNumber(mine.recoverableReservesKoz, 0)
                      : EMPTY}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Effective AISC</dt>
                  <dd className="tabular-nums font-medium">
                    {mine.effectiveAiscPerOz != null
                      ? formatPrice(mine.effectiveAiscPerOz, "USD", 0)
                      : EMPTY}
                    {mine.aiscIsCompanyFallback && (
                      <span className="ml-1 text-xs font-normal text-muted">company</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Close margin</dt>
                  <dd className="tabular-nums font-medium">
                    {mine.spotMargin != null ? formatPrice(mine.spotMargin, "USD", 0) : EMPTY}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">NPV @ 3y</dt>
                  <dd className="tabular-nums font-medium">{fmtMusd(mine.npvBaselineMusd)}</dd>
                </div>
                <div>
                  <dt className="text-muted">NPV @ close</dt>
                  <dd className="tabular-nums font-medium">
                    {fmtMusd(mine.npvCloseMusd)}
                    {share != null && (
                      <span className="ml-1 text-xs font-normal text-muted">
                        ({formatNumber(share, 0)}%)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              {mine.notes && <p className="mt-2 text-xs text-muted">{mine.notes}</p>}
              {mine.asOf && <p className="mt-1 text-xs text-muted">As of {formatDate(mine.asOf)}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SourcesPanel({ detail }: { detail: CompanyDetail }) {
  if (detail.sources.length === 0) {
    return <p className="text-sm text-muted">No source links entered yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {detail.sources.map((source) => (
        <li key={source.url} className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            {SOURCE_KIND_LABELS[source.kind] ?? source.kind}
            {source.asOf && <> · {formatDate(source.asOf)}</>}
          </p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener"
            className="font-medium text-zinc-900 underline-offset-2 hover:text-accent-fg hover:underline dark:text-zinc-100"
          >
            {source.title} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

function MetricCard({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-1 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 ${
          emphasize ? "text-2xl" : "text-xl"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function fmtMusd(value: number | null | undefined): string {
  if (value == null) return EMPTY;
  return `$${formatNumber(value, 0)}M`;
}
