/**
 * DealerList — curated bullion dealers for one market, as small cards.
 * Data: the `dealers` table (seeded from data/seed/dealers.csv, edited by hand).
 */

import { DEALER_NOTE } from "@/content/gold";
import type { Dealer } from "@/lib/data/gold-physical";

export function DealerList({ dealers }: { dealers: Dealer[] }) {
  if (dealers.length === 0) {
    return <p className="text-sm text-muted">No dealers listed for this market yet.</p>;
  }
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dealers.map((dealer) => (
          <li key={dealer.id} className="rounded-lg border border-border bg-surface p-4">
            <a
              href={dealer.website}
              target="_blank"
              rel="noopener"
              className="font-medium text-zinc-900 hover:text-accent-fg hover:underline dark:text-zinc-100"
            >
              {dealer.name} <span aria-hidden="true">↗</span>
            </a>
            {dealer.hqCity && <p className="mt-0.5 text-xs text-muted">{dealer.hqCity}</p>}
            {dealer.sells && <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{dealer.sells}</p>}
            {dealer.notes && <p className="mt-1 text-xs text-muted">{dealer.notes}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{DEALER_NOTE}</p>
    </>
  );
}
