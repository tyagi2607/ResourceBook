# 11 — Gold Companies page (`/gold/companies`)

**Status:** Phase D dual P/NAV (mine DCF) built 2026-11-26. Phases A–C remain (screener + detail shell).

**Job (PLAN.md §4.4):** compare gold equities by Lassonde tier and miner ETFs, then open a ticker for dual P/NAV, mines, management, and filing sources. **Agnico Eagle (AEM)** is the deep mine-DCF template; **NEM / Barrick / Kinross** use provisional company-level proxy NAV until Gemini/filings upgrade them.

---

## Routes

| URL | What |
| --- | --- |
| `/gold/companies` | Screener (default tab: All) |
| `/gold/companies?tier=producer` | Producers with dual P/NAV columns |
| `/gold/companies?tier=miner_etf` | Miner ETFs |
| `/gold/companies/AEM` | Company detail, Overview |
| `/gold/companies/AEM?tab=valuation` | Dual-deck NAV table |
| `/gold/companies/AEM?tab=mines` | Mine NPVs |

---

## Dual P/NAV (hero metric)

| Deck | Gold price | Meaning |
| --- | --- | --- |
| **Baseline** | Trailing **3-year average** of `commodity_daily` GC=F closes | Normalized / fair-value deck |
| **Close** | Latest gold futures close (yesterday’s close after daily ETL) | Market deck |

**NAV** = sum of mine NPVs (after flat **30%** tax on cash flow, **5%** discount, flat life capped at 30 years) **+ cash − debt**.

**P/NAV** = `market_cap / 1e6 / nav_musd`.

| Method | When |
| --- | --- |
| `mine_dcf_v1` | Mine rows have production + recoverable reserves (AEM) |
| `company_proxy_v1` | No mine DCF inputs; uses consolidated production, AISC, reserves as one synthetic mine (NEM/B/KGC) |

Blank mine AISC → **company consolidated AISC**. Filing reserve metal prices are context only, not the hero baseline.

Recompute: `scripts/compute_company_nav.py` after `etl_yahoo.py` (weekday Actions workflow). Not live per-minute.

---

## Screener columns (producers)

Ticker · **P/NAV @ 3y** · **P/NAV @ close** · AISC · close margin · prod · P&P · reserve life · price · 1 day · market cap · jurisdiction.

Default sort: P/NAV @ close ascending. Provisional peers show a “Provisional proxy” sub-line.

---

## Detail tabs (one shell, tier-swapped)

1. **Overview** — dual P/NAV hero (producers), tier metric grid, AISC reported-vs-close, NAV bridge  
2. **Valuation** — dual-deck table (producers); study NPV (developers); cash/runway (explorers); stub (royalty)  
3. **Assets** — labeled Mines / Portfolio / Project / Properties by tier (`?tab=mines`)  
4. **Management** — `company_people`  
5. **Sources** — `company_sources`

TradingView equity chart sits under the tabs on every detail view (display-only).

---

## Sourcing ladder

**API / structured feed first → company filings / IR if the API does not expose it.** TradingView is embed-only (not written to Supabase).

| Input | Preferred | Fallback |
| --- | --- | --- |
| Gold close / 3y avg | Yahoo `GC=F` → `commodity_daily` | — |
| Equity price / mkt cap | Yahoo ETL | — |
| Shares / cash / debt | Yahoo / SEC XBRL when automated | Results release / AIF |
| AISC, mine koz, P&P | — | AIF / MD&A / results (curated CSV) |
| NAV / P/NAV | Computed daily | — |

---

## Schema

Migrations:

- [`20261023000000_company_mines_detail.sql`](../supabase/migrations/20261023000000_company_mines_detail.sql) — mines / people / sources  
- [`20261126000000_company_nav_dcf.sql`](../supabase/migrations/20261126000000_company_nav_dcf.sql) — recoverable koz, tax/discount, dual NAV columns, `company_nav_daily`

### Apply the new migration

1. Supabase Dashboard → **SQL Editor** → paste `20261126000000_company_nav_dcf.sql` → Run  
2. From repo root: `.venv\Scripts\python.exe scripts\seed_database.py`  
3. `.venv\Scripts\python.exe scripts\compute_company_nav.py` (needs gold history + market caps from Yahoo)

---

## Seed files

| File | Notes |
| --- | --- |
| `data/seed/companies.csv` | AEM deep fundamentals; NEM/B/KGC provisional proxy fields |
| `data/seed/company_mines.csv` | AEM 10 producing mines (prod + recoverable; AISC blank → company) |
| `data/seed/company_people.csv` | AEM management |
| `data/seed/company_sources.csv` | AEM + peer IR / SEC links |

---

## Files

| File | Role |
| --- | --- |
| `src/lib/valuation/mine-dcf.ts` | Pure DCF (TS) |
| `scripts/mine_dcf.py` / `compute_company_nav.py` | Daily NAV job |
| `src/lib/data/gold-companies.ts` | Screener + detail queries |
| `src/app/gold/companies/*` | UI |
| `src/components/companies/*` | Table, tabs, ReportedVsSpot |

---

## Still open

- Country/region tax table (replace flat 30%)  
- Development projects / equity stakes in NAV  
- Gemini PDF extraction to replace provisional peer rows  
- After-tax vs effective tax refinements; CAD/USD for non-USD listings  
