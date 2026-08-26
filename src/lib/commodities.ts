/**
 * =============================================================================
 * commodities.ts — Shared navigation data for ResourceBook
 * =============================================================================
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Front-end apps often keep "lists of things that drive the UI" in one place,
 * instead of hard-coding the same Gold/Silver/... names in many components.
 *
 * Think of this like a small reference table in a database:
 *   - commodities  -> rows that become the TOP navigation
 *   - goldNavLinks -> rows that become the Gold dropdown menu
 *
 * When we add Uranium pages later, we mostly edit THIS file + add routes,
 * instead of hunting through header components.
 */

/**
 * One commodity hub in the top navigation.
 *
 * - `slug` is used in the URL: /gold, /silver, etc.
 * - `label` is what the user sees in the menu
 * - `status` tells the UI whether to show real pages or a "Coming soon" stub
 */
export type CommodityStatus = "live" | "coming_soon";

export type Commodity = {
  slug: string;
  label: string;
  status: CommodityStatus;
};

/**
 * Top-nav commodities (PLAN.md).
 * Only Gold is "live" for MVP; the rest render stub pages so the menu never 404s.
 */
export const COMMODITIES: Commodity[] = [
  { slug: "gold", label: "Gold", status: "live" },
  { slug: "silver", label: "Silver", status: "coming_soon" },
  { slug: "copper", label: "Copper", status: "coming_soon" },
  { slug: "uranium", label: "Uranium", status: "coming_soon" },
  { slug: "oil", label: "Oil", status: "coming_soon" },
  { slug: "gas", label: "Gas", status: "coming_soon" },
  { slug: "battery-metals", label: "Battery Metals", status: "coming_soon" },
];

/**
 * Pages shown when you HOVER (desktop) or expand (mobile) the Gold menu.
 * Clicking the word "Gold" itself still goes to /gold (Overview).
 */
export type NavLink = {
  href: string;
  label: string;
  description: string;
};

export const GOLD_NAV_LINKS: NavLink[] = [
  {
    href: "/gold",
    label: "Overview",
    description: "Spot price, chart, narrative drivers, leaderboards",
  },
  {
    href: "/gold/physical",
    label: "Physical (Metal ETFs & Dealers)",
    description: "Own the metal — ETFs/trusts and dealers by CA/US",
  },
  {
    href: "/gold/companies",
    label: "Companies (Equities & Miner ETFs)",
    description: "Lassonde curve screener plus miner ETFs",
  },
];

/** Helper: look up a commodity by URL slug (e.g. "silver"). */
export function getCommodityBySlug(slug: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.slug === slug);
}
