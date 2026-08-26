/**
 * ComingSoonStub — shared body for non-Gold commodity hubs
 *
 * `slug` drives the commodity accent (silver label, copper borders, etc.)
 * via CommodityScope → data-commodity → CSS variables in globals.css.
 *
 * "Explore Gold" is nested in its own gold scope so the CTA stays gold
 * even when you are viewing Silver / Copper / etc.
 */

import Link from "next/link";
import { CommodityScope } from "@/components/CommodityScope";
import type { CommodityThemeId } from "@/lib/commodity-theme";

type ComingSoonStubProps = {
  title: string;
  slug: CommodityThemeId;
};

export function ComingSoonStub({ title, slug }: ComingSoonStubProps) {
  return (
    <CommodityScope id={slug}>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-accent-fg">
          Coming soon
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          This commodity hub is on the roadmap. The Gold hub is live for the MVP —
          start there while we expand coverage.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CommodityScope id="gold" className="inline-flex">
            <Link
              href="/gold"
              className="rounded-md bg-accent-solid px-4 py-2 text-sm font-medium text-white hover:bg-accent-solid-hover"
            >
              Explore Gold
            </Link>
          </CommodityScope>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </CommodityScope>
  );
}
