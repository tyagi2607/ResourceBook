/**
 * Site Home — `/`
 *
 * PLAN.md: brand-first first viewport, then thesis sections.
 * No live ticker tape or dense dashboard widgets on Home for MVP.
 */

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResourceBook — Natural resources analytics",
  description:
    "Modern analytics for hard assets. Start with the Gold hub: physical metal ETFs, dealers, and mining equities.",
};

export default function HomePage() {
  return (
    <div>
      {/* ---------- First viewport: brand + one CTA ---------- */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Soft atmospheric background (not a flat single color) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--accent)_18%,transparent),_transparent_55%),linear-gradient(to_bottom,_var(--background),_var(--surface))]"
        />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-fg">
            ResourceBook
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Natural resources, organized for investors
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            A modern analytics portal for hard assets — starting with Gold.
            Commodity hubs, physical metal exposure, and mining equities along
            the Lassonde curve.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/gold"
              className="rounded-md bg-accent-solid px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-solid-hover"
            >
              Explore Gold
            </Link>
            <a
              href="#how-we-organize"
              className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              How we organize the market
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Why own natural resources ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Why own natural resources
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Resources are capital-intensive, cyclical, and foundational to the
          real economy. ResourceBook helps you compare exposure paths — physical
          metal, producers, developers, and explorers — without digging through
          fragmented filings portals alone.
        </p>
      </section>

      {/* ---------- How we organize ---------- */}
      <section
        id="how-we-organize"
        className="border-y border-border bg-zinc-50 dark:bg-zinc-950"
      >
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            How we organize the market
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Two dimensions: <strong>commodity hub</strong> (Gold, Silver, …) and{" "}
            <strong>risk curve</strong> (Royalty → Producer → Developer →
            Explorer), plus metal ETFs/dealers and miner ETFs.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Royalty & Streaming", "Lower operating risk capital providers"],
              ["Producers", "Operating mines — AISC, margins, reserves"],
              ["Developers", "Pre-production — NPV, IRR, study stage"],
              ["Explorers", "Discovery risk — runway, assays, jurisdiction"],
            ].map(([title, blurb]) => (
              <li
                key={title}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {blurb}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- What's live ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          What&apos;s live now
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          The <strong>Gold</strong> hub is the MVP focus. Other commodities are
          in the nav as placeholders so the full map of the product is visible.
        </p>
        <Link
          href="/gold"
          className="mt-6 inline-flex rounded-md bg-accent-solid px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-solid-hover"
        >
          Open Gold Overview
        </Link>
      </section>
    </div>
  );
}
