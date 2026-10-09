/**
 * =============================================================================
 * Gold Overview — `/gold`
 * =============================================================================
 *
 * JOB (PLAN.md §4.2): macro + narrative gateway for the Gold hub.
 *
 * SECTIONS (top to bottom)
 *   1. Live quotes   — spot, 1-day change, day range, gold/silver ratio (TradingView)
 *   2. Market cards  — gold futures last close + GLD volume vs normal (Supabase)
 *   3. Price chart   — TradingView widget (same feed as the quotes, so they match)
 *   4. Why Gold      — intro + driver strip, one live number each -> /gold/why
 *   5. Supply/demand — light preview (src/content/gold.ts)
 *   6. Leaderboards  — top movers + lowest AISC producers (Supabase)
 *   7. Ways to own   — links to Physical and Companies, with row counts
 *
 * DATA FRESHNESS
 * --------------
 * Quotes and chart load live in the visitor's browser from TradingView.
 * Everything else is a Server Component: it queries Supabase on the server and sends
 * finished HTML. `revalidate = 3600` means Next.js builds the page once,
 * serves that copy to everyone, and rebuilds it in the background at most once
 * an hour. Our database only changes daily, so hourly is plenty.
 * (In `npm run dev` the page is rebuilt on every refresh.)
 *
 * Accent colors come from gold/layout.tsx (data-commodity="gold").
 */

import Link from "next/link";
import type { Metadata } from "next";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { TradingViewQuotes } from "@/components/charts/TradingViewQuotes";
import { DriverStrip, type DriverMetric } from "@/components/overview/DriverStrip";
import { Leaderboard } from "@/components/overview/Leaderboard";
import { MarketCards } from "@/components/overview/MarketCards";
import { PageSection as Section } from "@/components/ui/PageSection";
import {
  GEOPOLITICS_HEADLINE,
  GOLD_DEMAND,
  GOLD_DRIVERS,
  GOLD_INTRO,
  GOLD_SUPPLY,
  GOLD_SUPPLY_DEMAND_SOURCE,
  type DriverId,
  type SupplyDemandItem,
} from "@/content/gold";
import {
  getCentralBankData,
  getFiscalTop10,
  getFuturesCard,
  getRealRatesSnapshot,
  getVolumeCard,
  type CentralBankData,
  type FiscalTable,
  type RealRatesSnapshot,
} from "@/lib/data/gold-macro";
import { getGoldOverviewData, type CompanyMover } from "@/lib/data/gold-overview";
import { changeTone, formatDate, formatNumber, formatPercent, formatPrice, formatTonnesChange } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gold Overview",
  description:
    "Live gold price, gold/silver ratio, macro drivers, supply and demand, and mining equity leaderboards.",
};

export default async function GoldOverviewPage() {
  // All queries run in parallel; each one fails independently (null = unavailable).
  const [data, futures, volume, reserves, fiscal, rates] = await Promise.all([
    getGoldOverviewData(),
    getFuturesCard(),
    getVolumeCard(),
    getCentralBankData(),
    getFiscalTop10(),
    getRealRatesSnapshot(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
      <HubPageHeader
        slug="gold"
        eyebrow="Gold hub"
        title="Gold overview"
        intro={
          <p>
            Where gold trades today, what drives it, and the ways to own it, from
            physical metal to royalty companies and junior explorers.
          </p>
        }
      />

      {data.hadError && (
        <p
          role="status"
          className="rounded-md border border-border bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Some data couldn&apos;t be loaded right now. Sections below may be
          incomplete.
        </p>
      )}

      {/* Quotes and chart share one TradingView feed, so their numbers always match. */}
      <div className="space-y-4">
        <TradingViewQuotes
          symbol="OANDA:XAUUSD"
          ratio={{
            symbol: "OANDA:XAUUSD/OANDA:XAGUSD",
            label: "Gold / silver ratio",
            description: "Ounces of silver one ounce of gold buys",
          }}
        />
        <MarketCards futures={futures} volume={volume} />
        <TradingViewChart symbol="OANDA:XAUUSD" />
      </div>

      <Section
        title="Why gold"
        intro="Four macro forces explain most of gold's long-run moves. Each tile shows one live number; open it for the full data."
      >
        <div className="mb-5 max-w-3xl space-y-3 text-zinc-600 dark:text-zinc-400">
          {GOLD_INTRO.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <DriverStrip drivers={GOLD_DRIVERS} metrics={driverMetrics(reserves, fiscal, rates)} />
      </Section>

      <Section
        title="Supply and demand"
        intro="A quick map of where gold comes from and who buys it."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FlowList heading="Supply" items={GOLD_SUPPLY} />
          <FlowList heading="Demand" items={GOLD_DEMAND} />
        </div>
        <p className="mt-3 text-xs text-muted">
          Source for figures and trends:{" "}
          <a
            href={GOLD_SUPPLY_DEMAND_SOURCE.href}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-accent-fg"
          >
            {GOLD_SUPPLY_DEMAND_SOURCE.label}
          </a>
        </p>
      </Section>

      <Section
        title="Leaderboards"
        intro="Gold equities ranked from the ResourceBook database."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Leaderboard
            title="Top gainers"
            description="Largest 1-day rise, gold companies"
            rows={data.gainers.map(moverRow)}
            emptyMessage="No gold companies rose on the latest trading day."
          />
          <Leaderboard
            title="Top decliners"
            description="Largest 1-day fall, gold companies"
            rows={data.decliners.map(moverRow)}
            emptyMessage="No gold companies fell on the latest trading day."
          />
          <Leaderboard
            title="Lowest AISC producers"
            description="All-in sustaining cost per ounce, latest reported"
            rows={data.aiscLeaders.map((row) => ({
              key: row.symbol,
              primary: row.ticker,
              secondary: row.name,
              value: `${formatPrice(row.aisc_per_oz, "USD", 0)}/oz`,
            }))}
            emptyMessage="No AISC figures entered yet. They come from company filings."
            footerLink={{ href: "/gold/companies?tier=producer", label: "All producers" }}
          />
        </div>
      </Section>

      <Section title="Ways to own gold" intro="Pick your spot on the risk curve.">
        <div className="grid gap-4 md:grid-cols-2">
          <PathwayCard
            href="/gold/physical"
            title="Physical metal"
            body="Metal-backed ETFs and trusts, plus vetted bullion dealers, filtered for Canada or the US."
            stats={[
              `${data.counts.vehicles} ETFs & trusts`,
              `${data.counts.dealers} dealers`,
            ]}
          />
          <PathwayCard
            href="/gold/companies"
            title="Mining companies"
            body="Royalty companies, producers, developers, and explorers, plus miner ETFs for diversified exposure."
            stats={[
              `${data.counts.companies} companies`,
              `${data.counts.minerEtfs} miner ETFs`,
            ]}
          />
        </div>
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Helpers that turn query results into display rows
 * ------------------------------------------------------------------------- */

function moverRow(row: CompanyMover) {
  return {
    key: row.symbol,
    primary: row.ticker,
    secondary: row.name,
    value: formatPercent(row.change_pct),
    valueClassName: changeTone(row.change_pct),
  };
}

/** One headline number per "Why gold" driver; anything missing shows "—". */
function driverMetrics(
  reserves: CentralBankData | null,
  fiscal: FiscalTable | null,
  rates: RealRatesSnapshot | null,
): Partial<Record<DriverId, DriverMetric>> {
  const metrics: Partial<Record<DriverId, DriverMetric>> = { geopolitics: GEOPOLITICS_HEADLINE };

  const topBuyer = reserves?.topBuyers[0];
  if (topBuyer) {
    metrics["central-banks"] = {
      value: formatTonnesChange(topBuyer.change12m),
      caption: `${topBuyer.name}, the biggest official buyer over the past 12 months (IMF)`,
    };
  }

  const us = fiscal?.rows.find((row) => row.iso3 === "USA");
  if (fiscal && us?.debtPct != null) {
    const deficit = us.balancePct != null && us.balancePct < 0 ? `, deficit ${formatNumber(-us.balancePct, 1)}%` : "";
    metrics.deficits = {
      value: `${formatNumber(us.debtPct, 0)}%`,
      caption: `US government debt to GDP, ${fiscal.year}${deficit} (IMF)`,
    };
  }

  if (rates) {
    metrics["real-rates"] = {
      value: `${rates.real.value.toFixed(2)}%`,
      caption: `US 10-year real yield, ${formatDate(rates.real.date)} (FRED)`,
    };
  }
  return metrics;
}

/* ---------------------------------------------------------------------------
 * Small layout pieces used only on this page
 * ------------------------------------------------------------------------- */

function FlowList({ heading, items }: { heading: string; items: SupplyDemandItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-fg">{heading}</h3>
      <dl className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.label}</dt>
            <dd className="text-sm text-zinc-600 dark:text-zinc-400">{item.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PathwayCard({
  href,
  title,
  body,
  stats,
}: {
  href: string;
  title: string;
  body: string;
  stats: string[];
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-border bg-surface p-5 transition hover:border-accent-border"
    >
      <h3 className="font-semibold text-zinc-900 group-hover:text-accent-fg dark:text-zinc-50">
        {title} →
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
      <p className="mt-4 flex flex-wrap gap-2">
        {stats.map((stat) => (
          <span
            key={stat}
            className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-fg"
          >
            {stat}
          </span>
        ))}
      </p>
    </Link>
  );
}
