/**
 * MarketSwitch — "USA — USD | Canada — CAD" toggle for /gold/physical.
 *
 * Each option is a plain link that sets `?market=` in the URL, so a filtered
 * view can be bookmarked or shared, and the page reloads its data on the
 * server for that market. USA is the default (no parameter).
 */

import Link from "next/link";
import type { Market } from "@/lib/data/gold-physical";

const OPTIONS: { market: Market; label: string; href: string }[] = [
  { market: "US", label: "USA — USD", href: "/gold/physical" },
  { market: "CA", label: "Canada — CAD", href: "/gold/physical?market=ca" },
];

export function MarketSwitch({ current }: { current: Market }) {
  return (
    <nav aria-label="Market" className="inline-flex rounded-full border border-border bg-surface p-1">
      {OPTIONS.map((option) => {
        const active = option.market === current;
        return (
          <Link
            key={option.market}
            href={option.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-accent-soft text-accent-fg"
                : "text-zinc-600 hover:text-accent-fg dark:text-zinc-400"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
