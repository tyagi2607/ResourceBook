# 04 — Commodity color theming

Minimal, professional accents per commodity. Same usage pattern as the original Gold amber (hub label, active nav pill, soft hover borders) — only the hue changes.

## Palette

| Commodity | Theme name | Light accent (approx.) | Dark accent (approx.) |
| --- | --- | --- | --- |
| Gold | Gold | `#a16207` | `#eab308` |
| Silver | Silver | `#64748b` | `#94a3b8` |
| Copper | Metallic copper | `#c2410c` | `#fb923c` |
| Uranium | Isotope green | `#4d7c0f` | `#a3e635` |
| Oil | Crude amber | `#92400e` | `#f59e0b` |
| Gas | Methane blue | `#0369a1` | `#38bdf8` |
| Battery Metals | Cobalt (placeholder) | `#4338ca` | `#818cf8` |

Oil is a deeper brown-amber than Gold so the two stay distinct. Battery Metals was not specified in the brief — muted cobalt is a temporary pick.

## How it works

1. **Tokens** live in [`src/app/globals.css`](../src/app/globals.css) under `[data-commodity="…"]`.
2. **Pages** wrap content in `<CommodityScope id="gold">` (see `src/app/gold/layout.tsx` and stub pages).
3. **Components** use Tailwind classes that read those tokens:
   - `text-accent-fg` — hub label / eyebrow
   - `bg-accent-soft` — soft fills
   - `hover:border-accent-border` — card hover
   - `bg-accent-solid` / `hover:bg-accent-solid-hover` — primary buttons
4. **Top nav** active pills use `.commodity-nav-pill` + `data-slug` so each commodity paints its own color when selected.

## Key files

| File | Role |
| --- | --- |
| `src/lib/commodity-theme.ts` | Theme id type + labels |
| `src/components/CommodityScope.tsx` | Sets `data-commodity` |
| `src/app/globals.css` | Hex / light-dark palettes |
| `src/components/layout/CommodityNav.tsx` | Active pills |
| `src/app/gold/layout.tsx` | Gold scope for all `/gold/*` |

## Home page

Home has no `data-commodity` wrapper; the **default** accent in `:root` is Gold (MVP featured commodity).

## Changing a color later

Edit the matching `[data-commodity="…"]` and `.commodity-nav-pill[data-slug="…"]` blocks in `globals.css`. Keep saturation low so the UI stays calm.

Back: [docs index](./README.md)
