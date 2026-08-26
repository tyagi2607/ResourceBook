/**
 * Gold Companies — `/gold/companies`
 * Lassonde equities screener + miner ETFs tab (structure only in this step).
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gold Companies — Equities & Miner ETFs",
  description:
    "Gold equities along the Lassonde curve, plus US and Canadian gold miner ETFs.",
};

const TABS = [
  "All",
  "Royalty & Streaming",
  "Producers",
  "Developers",
  "Explorers",
  "Miner ETFs",
] as const;

export default function GoldCompaniesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-medium text-accent-fg">Gold hub</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Companies — Equities &amp; Miner ETFs
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Individual mining companies by lifecycle stage, plus miner ETFs (sector
        beta — not physical metal funds). Those live on the Physical page.
      </p>

      {/* Visual preview of planned tabs (not wired yet) */}
      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <span
            key={tab}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-8 text-sm text-zinc-500 dark:border-zinc-700">
        Sortable table placeholder — seed data + Yahoo prices arrive after the
        Supabase schema step.
      </div>
    </div>
  );
}
