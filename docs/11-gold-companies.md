# 11 — Gold Companies page (`/gold/companies`)

**Status:** Built 2026-10-23 (PLAN.md build step 6, phases A–C). Phase D (full re-NAV at spot, Valuation tab) is still open.

**Job (PLAN.md §4.4):** compare gold equities by Lassonde tier and miner ETFs, then open a ticker for mines, management, and filing sources. **Agnico Eagle (AEM)** is the first deep template.

---

## Routes

| URL | What |
| --- | --- |
| `/gold/companies` | Screener (default tab: All) |
| `/gold/companies?tier=producer` | One equity tier |
| `/gold/companies?tier=miner_etf` | Miner ETFs (not physical gold) |
| `/gold/companies/AEM` | Company detail, Overview tab |
| `/gold/companies/AEM?tab=mines` | Mines tab |

---

## Reported vs spot (core rule)

Companies report **AISC** (a cost) and often illustrate margins or **NAV** at a **planning gold price**. We store that assumption next to the figure:

| Field | Meaning |
| --- | --- |
| `aisc_per_oz` | Reported consolidated AISC |
| `aisc_gold_price_usd` | Gold price the company used in guidance / outlook slides |
| Spot margin | `latest gold futures close − aisc_per_oz` |
| Assumption margin | `aisc_gold_price_usd − aisc_per_oz` |
| `nav_musd` + `nav_gold_price_usd` | Curated NAV at the source's gold price |

We **do not** recompute a full NAV at spot in this phase. Overview only labels the gold-price gap (assumption vs spot).

---

## Screener columns

**Producers / All (cost columns):** ticker, price, 1 day, market cap, AISC (with assumption sub-line), spot margin, production (koz), P&P (Moz), reserve life, jurisdiction; NAV / P/NAV when present.

**Developers:** study stage, jurisdiction (no AISC).

**Royalty / Explorers:** market columns + jurisdiction.

**Miner ETFs:** price, assets, fee, holdings blurb — no AISC.

Default sort: AISC ascending on producer views; market cap descending otherwise. Empty values sort last.

---

## Detail tabs

1. **Overview** — headline cards, ReportedVsSpot for AISC, optional cash/debt/NAV, mine rollup check  
2. **Management** — `company_people`  
3. **Mines** — per-mine cards; company consolidated line at top  
4. **Sources** — `company_sources` (AIF, reserves, presentation, MD&A, …)

### Mine rollup rules

- Attributable production / P&P = mine value × `ownership_pct` / 100, then sum  
- Weighted AISC = production-weighted average of mine AISCs (cross-check only)  
- **Screener AISC** always uses the **company consolidated** figure

---

## Schema

Migration: [`supabase/migrations/20261023000000_company_mines_detail.sql`](../supabase/migrations/20261023000000_company_mines_detail.sql)

| Table | Role |
| --- | --- |
| `companies` (+ columns) | Screener + company rollup fields |
| `company_mines` | One row per mine (`company_symbol`, `mine_slug`) |
| `company_people` | Management |
| `company_sources` | Filing links |

### Apply the migration

1. Supabase Dashboard → **SQL Editor** → New query  
2. Paste the whole migration file → Run  
3. From the repo root: `.venv\Scripts\python.exe scripts\seed_database.py`

---

## Seed files

| File | Notes |
| --- | --- |
| `data/seed/companies.csv` | New producer columns; AEM filled with midpoints (verify) |
| `data/seed/company_mines.csv` | AEM mine shells (fill koz / AISC / P&P from filings) |
| `data/seed/company_people.csv` | AEM CEO / CFO (verify tenure) |
| `data/seed/company_sources.csv` | Links from Notion Agnico research |

Blank CSV cells become NULL and **overwrite** prior DB values on re-seed.

---

## Files

| File | Role |
| --- | --- |
| `src/app/gold/companies/page.tsx` | Screener |
| `src/app/gold/companies/[ticker]/page.tsx` | Detail |
| `src/lib/data/gold-companies.ts` | Queries, rollups, parsers |
| `src/components/companies/*` | Tabs, tables, ReportedVsSpot |
| `src/content/gold.ts` | Wording |

---

## How to add another producer (deep)

1. Ensure the company row exists in `companies.csv`  
2. Add mine rows to `company_mines.csv`  
3. Add people / sources CSVs  
4. Fill consolidated AISC, `aisc_gold_price_usd`, production, reserves  
5. Re-run `seed_database.py`  

---

## Still open (Phase D+)

- Valuation tab and peer P/NAV bands  
- Re-NAV / mine DCF at spot  
- Gemini extraction from PDFs into the same tables  
- Fill mine-level koz / AISC / P&P for AEM from the reserve statement  
