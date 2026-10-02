/**
 * Gold Physical — `/gold/physical`
 * Metal ETFs/trusts + dealers, filtered by Canada (CAD) / USA (USD).
 * Data + filter UI arrive in a later step; this page establishes the route.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gold Physical — Metal ETFs & Dealers",
  description:
    "Physical gold exposure via metal-backed ETFs and trusts, plus dealers by country.",
};

export default function GoldPhysicalPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-medium text-accent-fg">Gold hub</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Physical — Metal ETFs &amp; Dealers
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Vehicles that track or hold physical gold (not miner equities). A
        Canada/USA country+currency control will filter both the ETF table and
        the dealer list.
      </p>

      <div className="mt-10 space-y-6">
        <section className="rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="font-semibold">Country / currency filter</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Placeholder — USA (USD) default, Canada (CAD) switch
          </p>
        </section>
        <section className="rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="font-semibold">Metal ETFs &amp; trusts table</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Price, NAV, premium/discount, expense ratio, vault
          </p>
        </section>
        <section className="rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="font-semibold">Dealers by location</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Curated directory filtered by the same country control
          </p>
        </section>
        <section className="rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="font-semibold">Premium / discount history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Chart from Supabase <code>vehicle_daily</code> history
          </p>
        </section>
      </div>
    </div>
  );
}
