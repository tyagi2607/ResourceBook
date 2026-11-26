/**
 * DetailTabs — Overview | Valuation | Assets | Management | Sources.
 * Assets label varies by tier; URL id stays `mines`.
 */

import Link from "next/link";
import { ASSETS_TAB_LABEL, DETAIL_TABS } from "@/content/gold";
import type { CompanyTier, DetailTab } from "@/lib/data/gold-companies";

export function DetailTabs({
  symbol,
  current,
  tier,
}: {
  symbol: string;
  current: DetailTab;
  tier: CompanyTier;
}) {
  const base = `/gold/companies/${encodeURIComponent(symbol)}`;
  const assetsLabel = ASSETS_TAB_LABEL[tier] ?? "Mines";

  return (
    <nav aria-label="Company sections" className="flex flex-wrap gap-2 border-b border-border pb-3">
      {DETAIL_TABS.map((tab) => {
        const active = tab.id === current;
        const href = tab.id === "overview" ? base : `${base}?tab=${tab.id}`;
        const label = tab.id === "mines" ? assetsLabel : tab.label;
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
