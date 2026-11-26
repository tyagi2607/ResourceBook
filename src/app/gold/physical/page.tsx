/**
 * =============================================================================
 * Gold Physical — `/gold/physical`
 * =============================================================================
 *
 * JOB (PLAN.md §4.3): ways to own the metal itself, for the US or Canada.
 *
 * SECTIONS (top to bottom)
 *   1. Market switch — USA (USD, default) or Canada (CAD), via `?market=ca`
 *   2. Funds         — metal ETFs, trusts, and receipts in a sortable table
 *   3. Dealers       — curated bullion dealers for the same market
 *
 * WHY THE URL HOLDS THE MARKET
 * ----------------------------
 * `searchParams` (the part of the URL after "?") is read on the server, so the
 * page queries only the selected market and a view like "Canada" can be
 * bookmarked or shared. In Next.js 16, `searchParams` arrives as a Promise and
 * must be awaited. Reading it makes the page render per request rather than
 * from a cached copy, which is fine: two small queries.
 *
 * Design notes and data decisions: docs/10-gold-physical.md.
 */

import type { Metadata } from "next";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { DealerList } from "@/components/physical/DealerList";
import { MarketSwitch } from "@/components/physical/MarketSwitch";
import { StructureCards } from "@/components/physical/StructureCards";
import { VehicleTable } from "@/components/physical/VehicleTable";
import { PageSection as Section } from "@/components/ui/PageSection";
import { SourceNote } from "@/components/ui/SourceNote";
import { PHYSICAL_INTRO, PREMIUM_NOTE } from "@/content/gold";
import { getRefreshTimes } from "@/lib/data/gold-macro";
import { getDealers, getVehicles, parseMarket, type Market } from "@/lib/data/gold-physical";

export const metadata: Metadata = {
  title: "Physical Gold — ETFs, Trusts & Dealers",
  description:
    "Compare physical gold ETFs, trusts, and receipts by fee, size, and trading volume, and find bullion dealers in the US or Canada.",
};

const MARKET_LABEL: Record<Market, string> = { US: "the US", CA: "Canada" };

export default async function GoldPhysicalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const market = parseMarket((await searchParams).market);

  // Queries run in parallel; each one fails independently (null = unavailable).
  const [vehicles, dealers, refreshed] = await Promise.all([
    getVehicles(market),
    getDealers(market),
    getRefreshTimes(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
      <div className="space-y-6">
        <HubPageHeader slug="gold" eyebrow="Gold hub" title="Physical gold" intro={<p>{PHYSICAL_INTRO}</p>} />
        <MarketSwitch current={market} />
      </div>

      <Section
        title="Gold funds"
        intro={`Funds listed in ${MARKET_LABEL[market]} that hold physical gold, not mining shares. Click a column to sort.`}
      >
        {vehicles === null ? (
          <Unavailable what="Fund data" />
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-muted">No funds listed for this market yet.</p>
        ) : (
          <div className="space-y-4">
            <StructureCards structures={vehicles.map((vehicle) => vehicle.structure)} />
            <VehicleTable vehicles={vehicles} marketLabel={MARKET_LABEL[market]} />
          </div>
        )}
        <SourceNote
          sources={[
            { label: "Yahoo Finance (prices, fund assets, trading volume; delayed)" },
            {
              label:
                "Issuer websites, compiled by ResourceBook (fees, vault, structure). Check the prospectus before investing",
            },
          ]}
          updatedAt={refreshed.yahoo_daily}
        >
          <p>{PREMIUM_NOTE}</p>
        </SourceNote>
      </Section>

      <Section title="Bullion dealers" intro={`Coins and bars, from dealers based in ${MARKET_LABEL[market]}.`}>
        {dealers === null ? <Unavailable what="Dealer list" /> : <DealerList dealers={dealers} />}
      </Section>
    </div>
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
