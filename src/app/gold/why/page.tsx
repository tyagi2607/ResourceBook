/**
 * =============================================================================
 * Why gold — `/gold/why`
 * =============================================================================
 *
 * The full version of the four drivers summarized on /gold (docs/08):
 *   #central-banks  official gold holdings and top buyers      (IMF)
 *   #deficits       debt and deficits, top 10 economies         (IMF)
 *   #geopolitics    three channels + live "proof" countries     (content + IMF)
 *   #real-rates     live formula, examples, gold vs real yield  (FRED + Yahoo)
 *
 * DATA FRESHNESS
 * --------------
 * Scripts in /scripts refresh the tables (daily for FRED/Yahoo, monthly for IMF).
 * This page re-reads them at most once an hour (`revalidate = 3600`).
 * Each section shows "Updated <date>" from data_refresh_log.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { HubPageHeader } from "@/components/brand/HubPageHeader";
import { CentralBanksSection } from "@/components/why/CentralBanksSection";
import { DebtSection } from "@/components/why/DebtSection";
import { GeopoliticsSection } from "@/components/why/GeopoliticsSection";
import { RealRatesSection } from "@/components/why/RealRatesSection";
import { GOLD_DRIVERS, GOLD_INTRO } from "@/content/gold";
import {
  getCentralBankData,
  getFiscalTop10,
  getGoldVsRealYield,
  getRealRatesSnapshot,
  getRefreshTimes,
} from "@/lib/data/gold-macro";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Why Gold",
  description:
    "Central bank gold buying, government debt and deficits, geopolitical risk, and real interest rates, with live data and sources.",
};

export default async function WhyGoldPage() {
  const [reserves, fiscal, ratesSnapshot, ratesHistory, refreshed] = await Promise.all([
    getCentralBankData(),
    getFiscalTop10(),
    getRealRatesSnapshot(),
    getGoldVsRealYield(),
    getRefreshTimes(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
      <div>
        <HubPageHeader
          slug="gold"
          eyebrow="Gold hub"
          title="Why gold"
          intro={
            <div className="space-y-3">
              {GOLD_INTRO.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          }
        />
        <nav aria-label="Drivers" className="mt-6 flex flex-wrap gap-2">
          {GOLD_DRIVERS.map((driver) => (
            <a
              key={driver.id}
              href={`#${driver.id}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-zinc-700 transition hover:border-accent-border hover:text-accent-fg dark:text-zinc-300"
            >
              {driver.title}
            </a>
          ))}
        </nav>
      </div>

      <CentralBanksSection data={reserves} updatedAt={refreshed.imf_gold_reserves} />
      <DebtSection data={fiscal} updatedAt={refreshed.imf_fiscal} />
      <GeopoliticsSection reserves={reserves} />
      <RealRatesSection snapshot={ratesSnapshot} history={ratesHistory} fredUpdatedAt={refreshed.fred} />

      <p className="text-sm">
        <Link href="/gold" className="font-medium text-accent-fg hover:underline">
          ← Back to the Gold overview
        </Link>
      </p>
    </div>
  );
}
