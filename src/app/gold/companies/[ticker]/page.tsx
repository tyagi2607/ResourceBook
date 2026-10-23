/**
 * =============================================================================
 * Company detail — `/gold/companies/[ticker]`
 * =============================================================================
 *
 * Tabs: Overview | Management | Mines | Sources (`?tab=`).
 * Overview contrasts company-reported AISC margins at the planning gold price
 * vs today's futures close. Mines roll up attributable production / P&P.
 *
 * docs/11-gold-companies.md
 */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { DetailTabs } from "@/components/companies/DetailTabs";
import { ReportedVsSpot } from "@/components/companies/ReportedVsSpot";
import {
  MINE_STATUS_LABELS,
  REPORTED_VS_SPOT_NOTE,
  ROLE_LABELS,
  SOURCE_KIND_LABELS,
} from "@/content/gold";
import { getCompanyDetail, parseDetailTab, type CompanyDetail } from "@/lib/data/gold-companies";
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
    description: `${detail.company.name}: overview, management, mines, and filing sources.`,
  };
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const symbol = decodeURIComponent((await params).ticker);
  const tab = parseDetailTab((await searchParams).tab);
  const detail = await getCompanyDetail(symbol);
  if (!detail) notFound();

  const { company } = detail;

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
        <DetailTabs symbol={company.symbol} current={tab} />
      </div>

      {tab === "overview" && <OverviewPanel detail={detail} />}
      {tab === "management" && <ManagementPanel detail={detail} />}
      {tab === "mines" && <MinesPanel detail={detail} />}
      {tab === "sources" && <SourcesPanel detail={detail} />}
    </div>
  );
}

function OverviewPanel({ detail }: { detail: CompanyDetail }) {
  const { company, spot, rollup } = detail;
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Production (koz)" value={company.productionKoz != null ? formatNumber(company.productionKoz, 0) : EMPTY} />
        <MetricCard
          label="P&P reserves (Moz)"
          value={company.reservesMoz != null ? formatNumber(company.reservesMoz, 1) : EMPTY}
        />
        <MetricCard
          label="Reserve life"
          value={company.reserveLife != null ? `${formatNumber(company.reserveLife, 1)} yr` : EMPTY}
        />
        <MetricCard
          label="Market cap"
          value={
            company.marketCap != null ? formatCompactPrice(company.marketCap, company.currency) : EMPTY
          }
        />
      </div>

      <ReportedVsSpot
        label="Consolidated AISC"
        reported={company.aiscPerOz}
        assumptionGold={company.aiscGoldPriceUsd}
        assumptionMargin={company.assumptionMargin}
        spotGold={spot?.price ?? null}
        spotMargin={company.spotMargin}
        spotAsOf={spot ? formatDate(spot.asOf) : null}
      />

      {(company.navMusd != null || company.cashMusd != null || company.debtMusd != null) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="NAV ($M)"
            value={company.navMusd != null ? formatNumber(company.navMusd, 0) : EMPTY}
            hint={
              company.navGoldPriceUsd != null
                ? `Reported at ${formatPrice(company.navGoldPriceUsd, "USD", 0)} Au` +
                  (spot ? ` · spot ${formatPrice(spot.price, "USD", 0)} (no re-NAV yet)` : "")
                : undefined
            }
          />
          <MetricCard
            label="Cash ($M)"
            value={company.cashMusd != null ? formatNumber(company.cashMusd, 0) : EMPTY}
          />
          <MetricCard
            label="Debt ($M)"
            value={company.debtMusd != null ? formatNumber(company.debtMusd, 0) : EMPTY}
          />
        </div>
      )}

      {detail.mines.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mine rollup (check)</h2>
          <p className="mt-1 text-sm text-muted">
            Sum of attributable mine rows. Screener AISC stays company consolidated; weighted mine AISC is a
            cross-check when mine costs are filled in.
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted">Attrib. production (koz)</dt>
              <dd className="font-medium tabular-nums">
                {rollup.attributableProductionKoz != null
                  ? formatNumber(rollup.attributableProductionKoz, 0)
                  : EMPTY}
                {company.productionKoz != null &&
                  rollup.attributableProductionKoz != null &&
                  Math.abs(rollup.attributableProductionKoz - company.productionKoz) > 1 && (
                    <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">≠ company</span>
                  )}
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

      <p className="text-xs text-muted">{REPORTED_VS_SPOT_NOTE}</p>
      {company.fundamentalsAsOf && (
        <p className="text-xs text-muted">Fundamentals as of {formatDate(company.fundamentalsAsOf)}</p>
      )}
    </div>
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
  const { company, spot, mines, rollup } = detail;
  if (mines.length === 0) {
    return <p className="text-sm text-muted">No mines entered yet. Add rows in data/seed/company_mines.csv.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Company consolidated</p>
        <p className="mt-1 text-muted">
          AISC {company.aiscPerOz != null ? formatPrice(company.aiscPerOz, "USD", 0) : EMPTY}
          {company.aiscGoldPriceUsd != null && (
            <> @ {formatPrice(company.aiscGoldPriceUsd, "USD", 0)} assumption</>
          )}
          {" · "}
          Production {company.productionKoz != null ? formatNumber(company.productionKoz, 0) : EMPTY} koz
          {" · "}
          Mine-weighted AISC {rollup.weightedAisc != null ? formatPrice(rollup.weightedAisc, "USD", 0) : EMPTY}
        </p>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {mines.map((mine) => (
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
                <dt className="text-muted">P&P (Moz)</dt>
                <dd className="tabular-nums font-medium">
                  {mine.reservesPpMoz != null ? formatNumber(mine.reservesPpMoz, 2) : EMPTY}
                </dd>
              </div>
              <div>
                <dt className="text-muted">AISC</dt>
                <dd className="tabular-nums font-medium">
                  {mine.aiscPerOz != null ? formatPrice(mine.aiscPerOz, "USD", 0) : EMPTY}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Spot margin</dt>
                <dd className="tabular-nums font-medium">
                  {mine.spotMargin != null ? formatPrice(mine.spotMargin, "USD", 0) : EMPTY}
                </dd>
              </div>
            </dl>
            {(mine.aiscPerOz != null || mine.aiscGoldPriceUsd != null) && (
              <p className="mt-2 text-xs text-muted">
                Assumption margin:{" "}
                {mine.assumptionMargin != null ? formatPrice(mine.assumptionMargin, "USD", 0) : EMPTY}
                {mine.aiscGoldPriceUsd != null && (
                  <> ({formatPrice(mine.aiscGoldPriceUsd, "USD", 0)} Au)</>
                )}
                {spot && <> · spot {formatPrice(spot.price, "USD", 0)}</>}
              </p>
            )}
            {mine.notes && <p className="mt-2 text-xs text-muted">{mine.notes}</p>}
            {mine.asOf && <p className="mt-1 text-xs text-muted">As of {formatDate(mine.asOf)}</p>}
          </li>
        ))}
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

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}