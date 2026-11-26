/**
 * =============================================================================
 * Gold Companies — `/gold/companies`
 * =============================================================================
 *
 * JOB (PLAN.md §4.4): equities by Lassonde tier + miner ETFs (not physical metal).
 *
 * Tabs live in the URL (`?tier=`), so a filtered view can be bookmarked.
 * Click a ticker to open `/gold/companies/[symbol]` for mines and reported-vs-spot.
 *
 * Design: docs/11-gold-companies.md.
 */

import type { Metadata } from "next";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { CompanyTable } from "@/components/companies/CompanyTable";
import { MinerEtfTable } from "@/components/companies/MinerEtfTable";
import { TierTabs } from "@/components/companies/TierTabs";
import { PageSection as Section } from "@/components/ui/PageSection";
import { SourceNote } from "@/components/ui/SourceNote";
import { COMPANIES_INTRO, NAV_SCREENER_NOTE, REPORTED_VS_SPOT_NOTE } from "@/content/gold";
import {
  getCompanies,
  getGoldSpotUsd,
  getMinerEtfs,
  parseTier,
  type CompanyTier,
  type ScreenerTab,
} from "@/lib/data/gold-companies";
import { getRefreshTimes } from "@/lib/data/gold-macro";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Gold Companies — Equities & Miner ETFs",
  description:
    "Compare gold royalties, producers, developers, explorers, and miner ETFs. Open a producer for mine-level costs and reported-vs-spot margins.",
};

export default async function GoldCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tier = parseTier((await searchParams).tier);
  const [spot, refreshed] = await Promise.all([getGoldSpotUsd(), getRefreshTimes()]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="space-y-6">
        <HubPageHeader slug="gold" eyebrow="Gold hub" title="Gold companies" intro={<p>{COMPANIES_INTRO}</p>} />
        <TierTabs current={tier} />
        {spot && (
          <p className="text-sm text-muted">
            Gold close (GC=F): {formatPrice(spot.price, "USD", 0)} · {formatDate(spot.asOf)}. Used for close
            AISC margins and P/NAV @ close.
          </p>
        )}
      </div>

      {tier === "miner_etf" ? (
        <MinerEtfSection updatedAt={refreshed.yahoo_daily} />
      ) : (
        <EquitySection tier={tier} spotUsd={spot?.price ?? null} updatedAt={refreshed.yahoo_daily} />
      )}
    </div>
  );
}

async function EquitySection({
  tier,
  spotUsd,
  updatedAt,
}: {
  tier: ScreenerTab;
  spotUsd: number | null;
  updatedAt?: string;
}) {
  const equityTier = tier === "all" ? null : (tier as CompanyTier);
  const companies = await getCompanies(equityTier, spotUsd);

  // All + Producers show cost/reserve columns (blanks sort last for non-producers on All).
  const showProducerMetrics = tier === "all" || tier === "producer";
  const showDeveloperMetrics = tier === "developer";

  return (
    <Section
      title={tier === "all" ? "Equities" : "Companies"}
      intro="Click a column to sort. Open a ticker for dual P/NAV, mines, and sources. Peer fundamentals marked provisional until Gemini/filings replace them."
    >
      {companies === null ? (
        <Unavailable what="Company data" />
      ) : companies.length === 0 ? (
        <p className="text-sm text-muted">No companies in this tier yet.</p>
      ) : (
        <CompanyTable
          companies={companies}
          showTier={tier === "all"}
          showProducerMetrics={showProducerMetrics}
          showDeveloperMetrics={showDeveloperMetrics}
        />
      )}
      <SourceNote
        sources={[
          { label: "Yahoo Finance (prices, market cap, GC=F; delayed)" },
          {
            label:
              "Company filings and IR materials, compiled by ResourceBook (AISC, reserves, production). Verify with the issuer",
          },
          { label: "ResourceBook mine DCF (NAV / P/NAV at 3y avg and close)" },
        ]}
        updatedAt={updatedAt}
      >
        <p>{NAV_SCREENER_NOTE}</p>
        <p className="mt-2">{REPORTED_VS_SPOT_NOTE}</p>
      </SourceNote>
    </Section>
  );
}

async function MinerEtfSection({ updatedAt }: { updatedAt?: string }) {
  const funds = await getMinerEtfs();
  return (
    <Section
      title="Miner ETFs"
      intro="Funds that hold mining shares (sector beta), not physical gold. Physical-metal ETFs live on the Physical page."
    >
      {funds === null ? (
        <Unavailable what="Miner ETF data" />
      ) : funds.length === 0 ? (
        <p className="text-sm text-muted">No miner ETFs listed yet.</p>
      ) : (
        <MinerEtfTable funds={funds} />
      )}
      <SourceNote
        sources={[
          { label: "Yahoo Finance (prices, fund assets; delayed)" },
          { label: "Issuer websites, compiled by ResourceBook (fees, holdings summary)" },
        ]}
        updatedAt={updatedAt}
      />
    </Section>
  );
}

function Unavailable({ what }: { what: string }) {
  return (
    <p
      role="status"
      className="rounded-md border border-border bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
    >
      {what} couldn&apos;t be loaded right now.
    </p>
  );
}
