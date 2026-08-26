/**
 * Gold Overview — `/gold`
 *
 * Accents come from the parent gold/layout.tsx (data-commodity="gold").
 * Use text-accent-fg / hover:border-accent-border — not hard-coded amber.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { GOLD_NAV_LINKS } from "@/lib/commodities";

export const metadata: Metadata = {
  title: "Gold Overview",
  description:
    "Gold macro hub — spot overview, narrative drivers, and pathways into physical metal and mining equities.",
};

export default function GoldOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-medium text-accent-fg">Gold hub</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Overview
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Macro gateway for gold. Live spot stats, TradingView chart, and database
        leaderboards land in the next build steps — structure first.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {GOLD_NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-border bg-surface p-4 transition hover:border-accent-border"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {link.label}
              </span>
              <span className="mt-1 block text-sm text-zinc-500">
                {link.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 space-y-6">
        <Placeholder
          title="Stats bar"
          note="Spot, 24h change, 52-week range — from Supabase after Yahoo ETL"
        />
        <Placeholder title="TradingView chart" note="Gold spot / futures embed" />
        <Placeholder
          title="Why Gold / tailwinds"
          note="Central banks, deficits, geopolitics, real rates"
        />
        <Placeholder
          title="Leaderboards"
          note="Top movers + AISC preview from DB"
        />
      </div>
    </div>
  );
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{note}</p>
    </div>
  );
}
