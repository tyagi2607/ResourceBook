/**
 * =============================================================================
 * HubMark — the ResourceBook logo mark for each commodity hub
 * =============================================================================
 *
 * Every hub gets the same precious-metal coin, struck in the hub's metal:
 *
 *   - reeded (ridged) outer edge and a raised rim, like a bullion coin
 *   - a polished face with a soft highlight toward the top-left
 *   - a ring of beads inside the rim
 *   - "RB" embossed in the middle
 *   - a small hallmark under the monogram that tells the hubs apart:
 *       gold "Au", silver "Ag", copper "Cu" (element symbols),
 *       uranium an atom, oil a drop, gas a flame, battery metals a battery
 *
 * COLOR
 * -----
 * Each hub has a fixed five-shade metal palette (PALETTES below), from the
 * brightest highlight to the deepest shadow. These are deliberately brighter
 * than the page accent colors: the accents are darkened so text stays
 * readable, which made the coin look like bronze. A real coin looks the same
 * in light and dark mode, so the palette doesn't change with the theme.
 *
 * The SVG is drawn on a 32 x 32 grid; `size` scales the whole thing.
 */

import type { CommodityThemeId } from "@/lib/commodity-theme";

type HubMarkProps = {
  slug: CommodityThemeId;
  /** Rendered width and height in pixels. */
  size?: number;
  className?: string;
};

type Palette = {
  shine: string; // brightest highlight
  light: string; // polished face
  base: string; // the metal's main color
  shade: string; // shadowed face, beads
  deep: string; // lettering, rim shadow
};

const PALETTES: Record<CommodityThemeId, Palette> = {
  gold: { shine: "#fef9c3", light: "#fde047", base: "#eab308", shade: "#ca8a04", deep: "#713f12" },
  silver: { shine: "#ffffff", light: "#e2e8f0", base: "#cbd5e1", shade: "#94a3b8", deep: "#334155" },
  copper: { shine: "#ffedd5", light: "#fdba74", base: "#ea8a4c", shade: "#c2410c", deep: "#7c2d12" },
  uranium: { shine: "#f7fee7", light: "#d9f99d", base: "#a3e635", shade: "#65a30d", deep: "#365314" },
  oil: { shine: "#fde68a", light: "#d97706", base: "#b45309", shade: "#78350f", deep: "#2a1203" },
  gas: { shine: "#f0f9ff", light: "#bae6fd", base: "#7dd3fc", shade: "#0284c7", deep: "#0c4a6e" },
  "battery-metals": { shine: "#eef2ff", light: "#c7d2fe", base: "#a5b4fc", shade: "#6366f1", deep: "#312e81" },
};

const LABELS: Record<CommodityThemeId, string> = {
  gold: "ResourceBook gold coin",
  silver: "ResourceBook silver coin",
  copper: "ResourceBook copper coin",
  uranium: "ResourceBook uranium coin",
  oil: "ResourceBook oil coin",
  gas: "ResourceBook gas coin",
  "battery-metals": "ResourceBook battery metals coin",
};

/** Coin geometry, in grid units. */
const CENTER = 16;
const EDGE_RADIUS = 15.5; // outside of the reeded edge
const FACE_RADIUS = 13.4; // inside of the rim, where the face starts
const BEAD_RADIUS = 11.6; // ring of beads
const REEDS = 64; // ridges around the edge
const BEADS = 40;

export function HubMark({ slug, size = 40, className = "" }: HubMarkProps) {
  const colors = PALETTES[slug];
  // Gradient ids must be unique per page. Two marks for the same hub would
  // share identical definitions, which is harmless.
  const edgeId = `hubmark-edge-${slug}`;
  const faceId = `hubmark-face-${slug}`;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={LABELS[slug]}
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Rim: lit from the top-left, shadowed toward the bottom-right. */}
        <linearGradient id={edgeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.shine} />
          <stop offset="0.45" stopColor={colors.base} />
          <stop offset="1" stopColor={colors.deep} />
        </linearGradient>
        {/* Face: a polished dome with its brightest spot up and to the left. */}
        <radialGradient id={faceId} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={colors.shine} />
          <stop offset="0.45" stopColor={colors.light} />
          <stop offset="1" stopColor={colors.shade} />
        </radialGradient>
      </defs>

      {/* Edge and rim */}
      <circle cx={CENTER} cy={CENTER} r={EDGE_RADIUS} fill={`url(#${edgeId})`} />
      <Reeding color={colors.deep} />

      {/* Face, with a thin shadow line where it meets the raised rim */}
      <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill={`url(#${faceId})`} />
      <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill="none" stroke={colors.deep} strokeOpacity={0.5} strokeWidth={0.5} />

      <Beads color={colors.shade} />
      <Shine />

      <Monogram color={colors.deep} />
      <g transform="translate(16 22.7)">{hallmark(slug, colors.deep)}</g>
    </svg>
  );
}

/** Short ridges all the way around the edge, like a milled bullion coin. */
function Reeding({ color }: { color: string }) {
  return (
    <g stroke={color} strokeOpacity={0.45} strokeWidth={0.35}>
      {Array.from({ length: REEDS }, (_, i) => {
        const angle = (i / REEDS) * 2 * Math.PI;
        const [x1, y1] = polar(EDGE_RADIUS - 1.1, angle);
        const [x2, y2] = polar(EDGE_RADIUS - 0.1, angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  );
}

/** Ring of small raised beads just inside the rim. */
function Beads({ color }: { color: string }) {
  return (
    <g fill={color}>
      {Array.from({ length: BEADS }, (_, i) => {
        const [cx, cy] = polar(BEAD_RADIUS, (i / BEADS) * 2 * Math.PI);
        return <circle key={i} cx={cx} cy={cy} r={0.42} />;
      })}
    </g>
  );
}

/** A soft white arc on the upper-left of the face: the light catching the metal. */
function Shine() {
  const radius = FACE_RADIUS - 1.2;
  const [x1, y1] = polar(radius, deg(200));
  const [x2, y2] = polar(radius, deg(265));
  return (
    <path
      d={`M${x1} ${y1} A${radius} ${radius} 0 0 1 ${x2} ${y2}`}
      fill="none"
      stroke="white"
      strokeOpacity={0.6}
      strokeWidth={0.8}
      strokeLinecap="round"
    />
  );
}

/**
 * Embossed "RB": a light copy just below-right (where the raised edge catches
 * the light) under the dark letters, so they look struck into the metal.
 */
function Monogram({ color }: { color: string }) {
  const text = {
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontSize: 9.5,
    fontWeight: 800,
    style: { letterSpacing: "-0.03em" },
  };
  return (
    <>
      <text {...text} x={16.35} y={15.55} fill="white" fillOpacity={0.55}>
        RB
      </text>
      <text {...text} x={16} y={15.2} fill={color}>
        RB
      </text>
    </>
  );
}

/**
 * The small mark under "RB", drawn around (0, 0) and about 5 grid units wide.
 * Metals show their element symbol; the others show a tiny picture.
 */
function hallmark(slug: CommodityThemeId, color: string) {
  switch (slug) {
    case "gold":
      return <ElementSymbol symbol="Au" color={color} />;
    case "silver":
      return <ElementSymbol symbol="Ag" color={color} />;
    case "copper":
      return <ElementSymbol symbol="Cu" color={color} />;
    case "uranium":
      return (
        <g fill="none" stroke={color} strokeWidth={0.4}>
          {[0, 60, 120].map((angle) => (
            <ellipse key={angle} rx={2.6} ry={0.95} transform={`rotate(${angle})`} />
          ))}
          <circle r={0.6} fill={color} stroke="none" />
        </g>
      );
    case "oil":
      return (
        <path
          d="M0 -2.4 C0 -2.4 -1.7 -0.4 -1.7 0.7 a1.7 1.7 0 0 0 3.4 0 C1.7 -0.4 0 -2.4 0 -2.4 Z"
          fill={color}
        />
      );
    case "gas":
      // Outer flame with a lick on the left, and a bright inner flame so it
      // doesn't read as a drop at small sizes.
      return (
        <>
          <path
            d="M0.1 -2.7 C0.6 -1.6 2 -0.9 2 0.8 a2 2 0 0 1 -4 0 C-2 -0.3 -1.5 -0.9 -1 -1.3 C-1 -0.6 -0.8 -0.2 -0.5 0 C-0.6 -1.2 -0.3 -2 0.1 -2.7 Z"
            fill={color}
          />
          <path d="M0.1 -0.4 C0.5 0.2 1 0.6 1 1.2 a1 1 0 0 1 -2 0 C-1 0.6 -0.4 0.2 0.1 -0.4 Z" fill="white" fillOpacity={0.85} />
        </>
      );
    case "battery-metals":
      return (
        <g fill="none" stroke={color} strokeWidth={0.4}>
          <rect x={-2.4} y={-1.2} width={4.4} height={2.4} rx={0.4} />
          <rect x={2.05} y={-0.5} width={0.5} height={1} fill={color} stroke="none" />
          <path d="M-0.1 -0.9 L-0.9 0.15 H0 L-0.35 0.95 L0.6 -0.15 H-0.3 Z" fill={color} stroke="none" />
        </g>
      );
  }
}

function ElementSymbol({ symbol, color }: { symbol: string; color: string }) {
  return (
    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={3.6}
      fontWeight={700}
      fill={color}
      style={{ letterSpacing: "0.02em" }}
    >
      {symbol}
    </text>
  );
}

/** Point on a circle around the coin's center. Angle in radians, 0 = right, clockwise. */
function polar(radius: number, angle: number): [number, number] {
  return [round(CENTER + radius * Math.cos(angle)), round(CENTER + radius * Math.sin(angle))];
}

function deg(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Round to 3 decimals so server and browser render identical SVG text. */
function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
