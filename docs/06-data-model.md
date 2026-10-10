# 06 — Data model (data dictionary)

Source of truth: the SQL files in `supabase/migrations/`, run in date order:

| Migration | Adds |
| --- | --- |
| `20261002000000_initial_schema.sql` | The 10 instrument tables below |
| `20261009000000_gold_macro_data.sql` | Daily open/high/low/volume on `commodity_daily`, plus 5 macro and reference tables (see [Macro and reference tables](#macro-and-reference-tables)) |

This page explains every table in plain terms.

## Two kinds of tables

| Kind | Grain | Who writes | Who reads |
| --- | --- | --- | --- |
| **Current state** | one row per instrument | seed CSVs + daily ETL (upsert) | tables, screeners, stats bars |
| **Daily history** | one row per instrument per day | daily ETL (insert) | charts (e.g. premium/discount over time) |

Think of current-state tables as dimension tables with "latest snapshot" columns, and
history tables as daily fact tables.

```
commodities (slug)
 ├── vehicles (symbol)      ── vehicle_daily (symbol, as_of_date)
 ├── miner_etfs (symbol)    ── miner_etf_daily (symbol, as_of_date)
 ├── companies (symbol)     ── company_daily (symbol, as_of_date)
 │                          ── company_fundamentals_history (symbol, as_of_date)
 └── commodity_daily (commodity_slug, as_of_date)
dealers (id; unique name + country)
```

## Conventions

| Pattern | Meaning | Example |
| --- | --- | --- |
| `symbol` | Yahoo Finance symbol, primary key, used by the ETL | `PHYS.TO`, `CGL-C.TO` |
| `ticker` | Display ticker | `PHYS`, `CGL.C` |
| `*_pct` | Percent as a number | `1.25` = 1.25 % |
| `expense_ratio` | Fraction | `0.0040` = 0.40 % |
| `*_musd` | Millions of USD | `850` = $850M |
| `*_as_of` | When the value was last refreshed | |
| `country` | Listing country, drives the CA/US filter | `US`, `CA` |
| `currency` | Listing currency | `USD`, `CAD` |
| `is_active` | `false` hides a row without deleting it | |
| `created_at` / `updated_at` | Set automatically by Postgres | |

## Current-state tables

### `commodities` — one row per hub

| Column | Notes |
| --- | --- |
| `slug` (PK) | Matches the URL: `gold` → `/gold` |
| `name`, `status` | `status` is `live` or `coming_soon` |
| `spot_symbol` | Yahoo price symbol, e.g. `GC=F` (gold futures) |
| `price_unit` | e.g. `USD/oz` |
| `price`, `change_pct`, `high_52w`, `low_52w`, `price_as_of` | Filled by the ETL |

### `vehicles` — metal-backed ETFs, trusts, receipts (Physical page)

Funds that hold the **metal itself**.

| Column | Notes |
| --- | --- |
| `symbol` (PK), `ticker`, `commodity_slug` (FK), `name`, `issuer` | Identity |
| `structure` | `etf`, `trust`, or `receipt` |
| `exchange`, `country`, `currency` | Listing |
| `expense_ratio` | Fraction, must be between 0 and 0.05 |
| `vault_location`, `physical_redemption`, `website` | Curated |
| `market_price`, `nav_per_share`, `aum`, `change_pct`, `price_as_of`, `nav_as_of` | ETL |
| `premium_discount_pct` | **Computed by Postgres**: `(price − NAV) / NAV × 100`. Blank when NAV is unknown. Never written directly. |

### `miner_etfs` — ETFs holding mining companies (Companies page, Miner ETFs tab)

| Column | Notes |
| --- | --- |
| `symbol` (PK), `ticker`, `commodity_slug`, `name`, `issuer` | Identity |
| `focus` | `majors`, `juniors`, `explorers`, or `broad` |
| `exchange`, `country`, `currency`, `expense_ratio`, `holdings_summary`, `website` | Curated |
| `market_price`, `aum`, `change_pct`, `price_as_of` | ETL |

### `companies` — individual equities by Lassonde tier

| Column | Notes |
| --- | --- |
| `symbol` (PK), `ticker`, `commodity_slug`, `name` | Identity |
| `tier` | `royalty`, `producer`, `developer`, or `explorer` |
| `exchange`, `country`, `currency` | Listing |
| `hq_country`, `primary_asset`, `asset_location` | Context |
| `jurisdiction_risk` | `Tier 1`, `Tier 2`, or `Tier 3` |
| `study_stage` | `PEA`, `PFS`, or `FS` (developers) |
| `market_price`, `market_cap`, `change_pct`, `price_as_of` | ETL |
| `aisc_per_oz`, `reserves_moz` | Producers (curated) |
| `npv_5pct_musd`, `irr_pct`, `initial_capex_musd` | Developers (curated) |
| `cash_runway_months`, `latest_assay` | Explorers (curated) |
| `fundamentals_as_of`, `fundamentals_source` | Where/when fundamentals came from |
| `metadata` | JSON for extras that don't deserve a column yet |

Which metrics show per tier follows `PLAN.md`: royalty/producer → AISC and reserves;
developer → NPV, IRR, capex, study stage; explorer → cash runway and latest assay.

### `dealers` — physical bullion dealers (Physical page)

| Column | Notes |
| --- | --- |
| `id` (PK) | Auto-generated number |
| `name`, `country` | Unique together (used by the seed script to match rows) |
| `website`, `hq_city`, `sells`, `online`, `notes` | Curated |

## Daily history tables

All keyed by `(symbol or commodity_slug, as_of_date)`, so there is **at most one row per
instrument per day**. Re-running the ETL for the same day updates instead of duplicating.
Deleting a parent row (e.g. a vehicle) deletes its history too (`on delete cascade`).

| Table | Columns beyond the key |
| --- | --- |
| `commodity_daily` | `open_price`, `high_price`, `low_price`, `close_price`, `volume`, `source`. Gold (`GC=F`) goes back to 2003 for the real-rates chart. |
| `vehicle_daily` | `close_price`, `nav_per_share`, computed `premium_discount_pct`, `volume`, `source` |
| `miner_etf_daily` | `close_price`, `volume`, `source` |
| `company_daily` | `close_price`, `market_cap`, `volume`, `source` |
| `company_fundamentals_history` | `aisc_per_oz`, `reserves_moz`, `npv_5pct_musd`, `irr_pct`, `cash_runway_months`, `source`. One row each time fundamentals are updated (roughly quarterly). |

Example: "average premium to NAV over time" for US gold vehicles is:

```sql
select d.as_of_date, avg(d.premium_discount_pct) as avg_premium_pct
from vehicle_daily d
join vehicles v using (symbol)
where v.commodity_slug = 'gold' and v.country = 'US'
group by d.as_of_date
order by d.as_of_date;
```

## Macro and reference tables

Data that isn't about one instrument: interest rates, government finances, central bank gold, and
a log of the scripts that load it. Filled by the jobs in [09 — Data jobs](./09-data-jobs.md);
shown on `/gold` (driver strip) and `/gold/why`.

### `macro_series` and `macro_observations` — economic time series (FRED)

A dimension table plus a fact table, so any future series (CPI, dollar index, …) fits without a
new table.

| Table | Key | Other columns |
| --- | --- | --- |
| `macro_series` | `series_id`, e.g. `DFII10` | `title`, `units`, `frequency`, `source`, `source_url`, `citation` (the exact credit line the page shows) |
| `macro_observations` | `(series_id, obs_date)` | `value` |

Series loaded: `DFII10` (10-year real yield), `DGS10` (10-year nominal yield), `T10YIE`
(10-year breakeven inflation). All in percent.

### `country_fiscal` — government debt and deficits (IMF)

One row per country per year, 2000 to two years ahead.

| Column | Notes |
| --- | --- |
| `country_iso3`, `year` (PK) | e.g. `USA`, `2026` |
| `country_name` | Short display name ("United States", "South Korea") |
| `gross_debt_pct_gdp` | General government gross debt, % of GDP |
| `fiscal_balance_pct_gdp` | Net lending/borrowing, % of GDP. **Negative = deficit.** |
| `gdp_usd_bn` | GDP in billions of current US dollars (used to pick the top 10) |
| `is_projection` | `true` for the current year and later (IMF estimates) |
| `vintage` | IMF release the numbers come from, e.g. `April 2026` |

### `central_bank_gold_reserves` — official gold holdings by country

One row per country, per month, per source, so IMF, WGC (if ever permitted), and hand-entered rows
can sit side by side. The page prefers `imf` over `manual` for the same country and month.

| Column | Notes |
| --- | --- |
| `country_iso3`, `period`, `source` (PK) | `period` is the first day of the month the figure refers to; `source` is `imf`, `wgc`, or `manual` |
| `country_name` | Display name |
| `tonnes` | Converted from fine troy ounces (1 t = 32,150.7466 oz) |
| `gold_value_usd` | Gold at **market** price (revalued where a country books it at a historical price) |
| `total_reserves_usd` | Official reserve assets, with gold at market price |
| `pct_of_reserves` | Gold's share of total reserves, % |

Cleaning rules (unit errors, skipped months) are listed in
[09 — Data jobs](./09-data-jobs.md#data-quality-rules-central-bank-reserves).

### `data_refresh_log` — one row per script run

`id`, `job`, `ran_at`, `status` (`ok` or `error`), `rows_written`, `message`. Powers the
"Updated <date>" lines and is the first place to look when a number seems stale.

## Security

- Row Level Security is **on** for all 15 tables.
- Policy **"Public read access"**: anyone (publishable key) can `SELECT`.
- Insert/update/delete are revoked from public roles. Only the secret key
  (`service_role`, used by `/scripts`) can write.
- `scripts/check_database.py` proves both rules against the live database.

## Seed data status

The starter CSVs in `data/seed/` were drafted for review. Rows with a `verify` note
(recent ticker changes, blank expense ratios) should be checked before launch.
Company fundamentals are intentionally blank, to be curated from filings.
