/**
 * =============================================================================
 * commodity-theme.ts — Per-commodity accent colors (minimal, professional)
 * =============================================================================
 *
 * HOW THIS WORKS
 * --------------
 * Each commodity has a short "theme key" (same as its URL slug).
 * Pages set `data-commodity="gold"` (etc.) on a wrapper.
 * `globals.css` maps that attribute to CSS variables:
 *   --accent, --accent-fg, --accent-soft, --accent-border
 *
 * Components then use Tailwind classes like `text-accent`, `bg-accent-soft`,
 * `hover:border-accent-border` instead of hard-coded amber-* classes.
 *
 * Think of this like a lookup table: slug → color palette row.
 */

/** Slugs that have a defined accent palette. */
export type CommodityThemeId =
  | "gold"
  | "silver"
  | "copper"
  | "uranium"
  | "oil"
  | "gas"
  | "battery-metals";

/**
 * Human-readable color names (for docs / designers).
 * Hex values live in globals.css so light/dark can differ slightly.
 */
export const COMMODITY_THEME_LABELS: Record<CommodityThemeId, string> = {
  gold: "Gold",
  silver: "Silver",
  copper: "Metallic copper",
  uranium: "Isotope green",
  oil: "Crude amber",
  gas: "Methane blue",
  "battery-metals": "Cobalt (battery)",
};

/** True if the slug has a commodity accent palette. */
export function isCommodityThemeId(slug: string): slug is CommodityThemeId {
  return slug in COMMODITY_THEME_LABELS;
}
