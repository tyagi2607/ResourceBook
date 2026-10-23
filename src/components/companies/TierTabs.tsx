/**
 * TierTabs — Lassonde tiers + Miner ETFs for /gold/companies.
 * Selection lives in the URL (`?tier=`), same idea as the Physical market switch.
 */

import Link from "next/link";
import { TIER_TABS } from "@/content/gold";
import type { ScreenerTab } from "@/lib/data/gold-companies";

export function TierTabs({ current }: { current: ScreenerTab }) {
  return (
    <nav aria-label="Company tier" className="flex flex-wrap gap-2">
      {TIER_TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-accent-soft text-accent-fg"
                : "border border-border text-zinc-600 hover:text-accent-fg dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
