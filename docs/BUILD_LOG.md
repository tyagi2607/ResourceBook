# Build log

Chronological record of what we implemented. Newest entries at the top.

---

## 2026-08-25 — Commodity-specific accent colors

**Goal:** Keep the minimal Gold accent pattern, but give each commodity its own muted hue.

### Shipped

- CSS variable palettes in `globals.css` for gold, silver, copper, uranium, oil, gas, battery-metals
- `CommodityScope` + `gold/layout.tsx` so Gold pages inherit gold accents
- Stub pages use their own commodity color for “Coming soon” label
- Top-nav active pills color by commodity (`data-slug`)
- Replaced hard-coded `amber-*` classes with `text-accent-fg`, `border-accent-border`, `bg-accent-solid`
- Doc: `docs/04-commodity-colors.md`

### How to review

```powershell
npm run dev
```

Visit `/gold` (gold accents), `/silver` (silver), `/copper`, `/uranium`, `/oil`, `/gas` and confirm the top-nav active pill matches each hub.

---

## 2026-08-25 — Step 1: App shell scaffold

**Goal:** Runnable Next.js portal with Home, Gold routes, commodity stubs, theme, and simple Gold dropdown.

### Shipped

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + `lucide-react`
- Root layout with header, footer, theme provider
- Home (`/`) — brand-first hero + thesis sections
- Gold routes: `/gold`, `/gold/physical`, `/gold/companies` (layout placeholders)
- Dynamic stubs: `/silver`, `/copper`, `/uranium`, `/oil`, `/gas`, `/battery-metals`
- Theme: system / light / dark with `localStorage`
- Commodity nav: click Gold → overview; hover → simple page list
- Footer investment disclaimer
- Docs under `docs/` (getting started, structure, theme/nav)

### Not yet (later steps)

- Supabase schema + seed data
- Yahoo ETL + history tables
- TradingView embeds
- Working Physical filter / ETF table / dealers
- Companies screener with real rows

### How to review

```powershell
npm install
npm run dev
```

Open http://localhost:3000 and click through Home → Gold → Physical / Companies → Silver stub → theme toggle.

### Key files to read (heavily commented)

- `src/lib/commodities.ts`
- `src/components/providers/ThemeProvider.tsx`
- `src/components/layout/CommodityNav.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx`
