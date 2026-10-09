# Build log

Chronological record of what we implemented. Newest entries at the top.

---

## 2026-10-09 — Steps 8 + 8b: Data jobs, `/gold` cards, and the new `/gold/why` page

**Goal:** Implement every phase of [doc 08](./08-gold-overview-data-plan.md): stored market
data, macro data, scheduled refreshes, and the pages that show them.

### Shipped

- **Hub marks:** `HubMark` logos for all 7 hubs, shown beside the "<Commodity> hub" label (coin
  for gold, silver, copper; atom for uranium; drop for oil; flame for gas; battery for battery
  metals). Coming-soon pages use them too.
- **Migration** `supabase/migrations/20261009000000_gold_macro_data.sql`: open/high/low/volume on
  `commodity_daily`; new tables `macro_series`, `macro_observations`, `country_fiscal`,
  `central_bank_gold_reserves`, `data_refresh_log` (public read, script write)
- **Python jobs** (all log to `data_refresh_log`, all safe to re-run):
  - `etl_yahoo.py`: gold futures since 2003, plus ETFs, miner ETFs, companies (build step 8)
  - `fetch_fred.py`: DFII10, DGS10, T10YIE (no key needed)
  - `fetch_imf_fiscal.py`: debt, deficit, GDP for 197 countries (IMF April 2026 release)
  - `fetch_imf_gold_reserves.py`: official gold by country, monthly since 2016, with unit
    corrections and market revaluation
  - `load_manual_data.py`: optional Excel-first CSV loader (`data/manual/`)
- **Schedules:** `.github/workflows/data-daily.yml` (weekdays) and `data-monthly.yml` (10th)
- **`/gold`:** futures last-close card, GLD volume-vs-normal card with a 30-day bar chart, the
  "Why gold" intro, and a 4-tile driver strip linking to `/gold/why`
- **`/gold/why`** (new; also in the Gold dropdown): central bank holders and buyers, top-10
  debt and deficits table, geopolitics channels with citations and live "proof" numbers,
  real-rates formula strip and a gold vs inverted real yield chart (Recharts)
- Every data section shows its source citation and an "Updated <date>" line
- Docs: new [09 — Data jobs](./09-data-jobs.md); doc 08 "As built"; docs 02, 06, README; `PLAN.md`

### Verified

- Data loaded: FRED ~28k observations, IMF fiscal 5,626 rows, IMF reserves 9,320 rows, Yahoo
  24,157 rows (gold futures: 5,972 days, last close $4,220.30)
- Spot checks: US 8,134 t of gold; Poland +133 t over 12 months; US debt 125.8% of GDP;
  5.22% − 2.35% = 2.87% real yield
- Lint, type-check, and production build pass; pages checked in light and dark mode; all 7 hub
  marks render

### Changed from the plan

- Central bank reserves come from the IMF script from day one (the CSV stopgap wasn't needed)
- FRED needs no API key; jobs run on two schedules instead of four
- See doc 08, "As built", for the full list

### Open items

- **You:** add the GitHub secrets `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` (steps in
  doc 09), then push so the schedules start
- Fix seed symbols `ODV` and `SGD.V` (not found on Yahoo)
- Optional: WGC permission email (draft in doc 08)
- Before any commercial launch: replace Yahoo with a licensed data source

---

## 2026-10-09 — Planning: Gold Overview data plan (no code)

**Goal:** Decide how each new Gold Overview datapoint is displayed, sourced, stored, and refreshed.

### Decided / found

- Plan written: `docs/08-gold-overview-data-plan.md`; `PLAN.md` §2, §4.2, §5, §7 updated
- World Gold Council terms forbid scraping, automated access, and republishing without written
  permission (info@gold.org). The Selenium download idea is off; IMF reserves data is the default
- IMF data may be republished with attribution (commercial reuse needs a request to copyright@imf.org)
- IMF DataMapper API (debt, deficit, GDP) works without a key
- FRED DFII10 = 2.92% on 2026-10-07; citation format captured
- Free TradingView widgets block COMEX futures (`COMEX:GC1!`, `COMEX_MINI:MGC1!`), so the
  futures card will use Yahoo `GC=F` previous close
- "74% of central banks expect a lower USD share in 5 years" verified (WGC survey, June 2026)

### Decisions

- Central bank reserves: hand-edited CSV first (IMF or central bank sources), IMF script later
- Volume signal: GLD; logo: beside "Gold hub" on the `/gold` header
- Deep driver sections move to a new `/gold/why` page; `/gold` gets a compact driver strip
- Educational now, commercial eventually (Yahoo must be replaced before commercial launch)

---

## 2026-10-08 — Step 4: Gold Overview page

**Goal:** Turn `/gold` from placeholders into the real macro + narrative gateway, reading
from Supabase.

### Shipped

- Live quote card (TradingView Symbol Info): gold spot, 1-day change, previous close, open, day's range
- Gold/silver ratio card (TradingView, `OANDA:XAUUSD/OANDA:XAGUSD`)
- TradingView advanced chart (`OANDA:XAUUSD`), re-themes with light/dark
- Quotes and chart share one feed so they always match (an earlier Supabase/Yahoo stats bar
  was replaced: Yahoo only has gold futures, which differ from spot)
- "Why gold" cards (4 macro drivers, each with what to watch)
- Supply and demand preview, sourced to the World Gold Council
- Leaderboards: top gainers, top decliners, lowest AISC producers
- "Ways to own gold" cards with live row counts from the database
- Page refreshes from Supabase at most hourly (`revalidate = 3600`)
- Reusable components: `TradingViewWidget`, `TradingViewQuotes`, `TradingViewChart`, `Leaderboard`
- Doc: `docs/07-gold-overview.md`

### Verified

- Counts load from Supabase (12 ETFs & trusts, 9 dealers, 15 companies, 9 miner ETFs)
- Quote card, ratio, and chart render in light and dark themes and show matching prices
- Lint, type-check, and production build pass

### Waiting on data

- Top movers: need the daily Yahoo ETL (step 8)
- AISC leaderboard: needs curated AISC values in `companies.csv`

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
