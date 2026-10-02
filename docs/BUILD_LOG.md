# Build log

Chronological record of what we implemented. Newest entries at the top.

---

## 2026-10-01 — Step 2: Supabase schema + seed data

**Goal:** Database ready to hold current values and daily history, with starter Gold data
and the app able to read it.

### Shipped

- Schema migration `supabase/migrations/20261002000000_initial_schema.sql`
  - 5 current-state tables: `commodities`, `vehicles`, `miner_etfs`, `companies`, `dealers`
  - 5 history tables: `commodity_daily`, `vehicle_daily`, `miner_etf_daily`, `company_daily`,
    `company_fundamentals_history`
  - `premium_discount_pct` computed by Postgres (only when NAV exists)
  - RLS: public read, writes only via the secret key
- Starter CSVs in `data/seed/` (Gold: 12 metal vehicles, 9 miner ETFs, 15 companies, 9 dealers)
- Python scripts: `scripts/seed_database.py` (upsert CSVs) and `scripts/check_database.py`
  (verifies read access and that public writes are blocked)
- `.env.example` template; `.env.local` (git-ignored) for real keys
- `@supabase/supabase-js` + `src/lib/supabase/server.ts` (read-only client for pages)
- Docs: `docs/05-database-setup.md`, `docs/06-data-model.md`

### How to review

Follow [05 — Database setup](./05-database-setup.md): fill `.env.local`, run the migration in
the Supabase SQL Editor, then run the seed and check scripts.

### Verified (2026-10-02)

- Migration applied in Supabase; seed loaded (7 / 12 / 9 / 15 / 9 rows)
- `check_database.py`: all 10 tables readable with the publishable key; public insert rejected (HTTP 401)

### Open items

- Verify seed rows marked `verify` in the CSV `notes` column
- Curate company fundamentals (AISC, NPV, etc.)

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
