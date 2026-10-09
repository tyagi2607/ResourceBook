/**
 * =============================================================================
 * HubMark — the ResourceBook logo mark for each commodity hub
 * =============================================================================
 *
 * One component, seven drawings (docs/08-gold-overview-data-plan.md, card 1):
 *
 *   gold, silver, copper -> the same coin with "RB" in the middle
 *   uranium              -> an atom (nucleus of protons + neutrons, electron orbits)
 *   oil                  -> an oil drop with "RB" inside
 *   gas                  -> a flame with "RB" at its base
 *   battery-metals       -> a battery with "RB" inside and a charge bolt
 *
 * COLOR
 * -----
 * Every line and fill uses `currentColor`, and the wrapper sets `text-accent`.
 * The accent comes from the nearest `data-commodity="..."` wrapper (see
 * globals.css), so the coin is gold on /gold, silver on /silver, and so on —
 * light and dark mode included — without passing any colors in.
 *
 * The SVGs are drawn on a 32 x 32 grid; `size` scales the whole thing.
 */

import type { CommodityThemeId } from "@/lib/commodity-theme";

type HubMarkProps = {
  slug: CommodityThemeId;
  /** Rendered width and height in pixels. */
  size?: number;
  className?: string;
};

const LABELS: Record<CommodityThemeId, string> = {
  gold: "ResourceBook gold coin",
  silver: "ResourceBook silver coin",
  copper: "ResourceBook copper coin",
  uranium: "ResourceBook uranium atom",
  oil: "ResourceBook oil drop",
  gas: "ResourceBook gas flame",
  "battery-metals": "ResourceBook battery",
};

export function HubMark({ slug, size = 40, className = "" }: HubMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={LABELS[slug]}
      className={`shrink-0 text-accent ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawing(slug)}
    </svg>
  );
}

function drawing(slug: CommodityThemeId) {
  switch (slug) {
    case "gold":
    case "silver":
    case "copper":
      return <Coin />;
    case "uranium":
      return <Atom />;
    case "oil":
      return <Drop />;
    case "gas":
      return <Flame />;
    case "battery-metals":
      return <Battery />;
  }
}

/** "RB" monogram. `fontSize` is in grid units (the SVG is 32 units wide). */
function Monogram({ x = 16, y = 16, fontSize = 10 }: { x?: number; y?: number; fontSize?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight={700}
      fill="currentColor"
      stroke="none"
      style={{ letterSpacing: "-0.04em" }}
    >
      RB
    </text>
  );
}

/** Coin: soft-filled disc, outer edge, a thin inner rim, and the monogram. */
function Coin() {
  return (
    <>
      <circle cx="16" cy="16" r="14.5" fill="currentColor" fillOpacity={0.14} strokeWidth={1.5} />
      <circle cx="16" cy="16" r="11.5" strokeWidth={0.75} strokeDasharray="1.2 1.4" />
      <Monogram fontSize={10.5} />
    </>
  );
}

/**
 * Atom: three electron orbits (ellipses rotated 0°, 60°, 120°), an electron dot on
 * each, and a nucleus of two protons (filled) and two neutrons (outlined).
 * No monogram: it would be unreadable inside the orbits at icon size.
 */
function Atom() {
  return (
    <>
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 16 16)`}>
          <ellipse cx="16" cy="16" rx="14" ry="5.2" strokeWidth={1.2} />
          <circle cx="30" cy="16" r="1.4" fill="currentColor" stroke="none" />
        </g>
      ))}
      <circle cx="14.6" cy="14.8" r="2" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="17.2" r="2" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="14.6" r="1.8" fill="var(--surface)" strokeWidth={1} />
      <circle cx="14.6" cy="17.4" r="1.8" fill="var(--surface)" strokeWidth={1} />
    </>
  );
}

/** Oil drop: pointed top, round base, monogram in the round part. */
function Drop() {
  return (
    <>
      <path
        d="M16 2.5 C16 2.5 6.5 13.5 6.5 20 a9.5 9.5 0 0 0 19 0 C25.5 13.5 16 2.5 16 2.5 Z"
        fill="currentColor"
        fillOpacity={0.14}
        strokeWidth={1.5}
      />
      <Monogram y={20.5} fontSize={8.5} />
    </>
  );
}

/** Flame: outer flame with a lick on the left, monogram at the base. */
function Flame() {
  return (
    <>
      <path
        d="M16 2.5 C17.5 7.5 25 10.5 25 19.5 a9 9 0 0 1 -18 0 C7 15.5 9 13 11 11.5 C11 14 12 15.5 13 16 C13 10 15 7 16 2.5 Z"
        fill="currentColor"
        fillOpacity={0.14}
        strokeWidth={1.5}
      />
      <Monogram y={22} fontSize={7.5} />
    </>
  );
}

/** Battery: body, terminal cap, monogram, and a small charge bolt. */
function Battery() {
  return (
    <>
      <rect x="2.5" y="9" width="23" height="14" rx="2.5" fill="currentColor" fillOpacity={0.14} strokeWidth={1.5} />
      <rect x="25.5" y="13" width="3.5" height="6" rx="1" fill="currentColor" stroke="none" />
      <Monogram x={11} y={16} fontSize={8} />
      <path d="M21.2 11.5 L18.6 16.4 H21 L19.8 20.5 L22.8 15.3 H20.4 Z" fill="currentColor" stroke="none" />
    </>
  );
}
