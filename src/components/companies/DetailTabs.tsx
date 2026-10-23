/**
 * DetailTabs — Overview | Management | Mines | Sources on a company page.
 */

import Link from "next/link";
import { DETAIL_TABS } from "@/content/gold";
import type { DetailTab } from "@/lib/data/gold-companies";

export function DetailTabs({ symbol, current }: { symbol: string; current: DetailTab }) {
  const base = `/gold/companies/${encodeURIComponent(symbol)}`;
  return (
    <nav aria-label="Company sections" className="flex flex-wrap gap-2 border-b border-border pb-3">
      {DETAIL_TABS.map((tab) => {
        const active = tab.id === current;
        const href = tab.id === "overview" ? base : `${base}?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-accent-soft text-accent-fg"
                : "text-zinc-600 hover:text-accent-fg dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
