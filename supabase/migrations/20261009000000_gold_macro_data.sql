-- =============================================================================
-- ResourceBook — Gold Overview macro data (docs/08-gold-overview-data-plan.md)
-- =============================================================================
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   Safe to re-run (IF NOT EXISTS everywhere). Run it AFTER the initial schema.
--
-- WHAT IT ADDS
--   1. Daily OHLC + volume on commodity_daily (gold futures card, volume history)
--   2. macro_series / macro_observations   — FRED series (real yield, nominal, breakeven)
--   3. country_fiscal                      — IMF debt and deficit, % of GDP
--   4. central_bank_gold_reserves          — official gold holdings by country, monthly
--   5. data_refresh_log                    — one row per script run ("Updated <date>" labels)
--
-- Same security model as before: public can SELECT, only scripts (secret key) write.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. commodity_daily: full daily bar (the Yahoo ETL already writes close_price)
-- -----------------------------------------------------------------------------
alter table public.commodity_daily add column if not exists open_price numeric(14, 4);
alter table public.commodity_daily add column if not exists high_price numeric(14, 4);
alter table public.commodity_daily add column if not exists low_price  numeric(14, 4);
alter table public.commodity_daily add column if not exists volume     bigint;


-- -----------------------------------------------------------------------------
-- 2. Macro time series (generic: any FRED / Treasury series fits here)
--    Like a dimension table (macro_series) + a fact table (macro_observations).
-- -----------------------------------------------------------------------------
create table if not exists public.macro_series (
  series_id    text primary key,          -- e.g. 'DFII10'
  title        text not null,
  units        text not null,             -- e.g. 'Percent'
  frequency    text not null,             -- e.g. 'Daily'
  source       text not null,             -- e.g. 'FRED'
  source_url   text not null,
  citation     text not null,             -- exact credit line shown on the page
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.macro_observations (
  series_id   text not null references public.macro_series (series_id) on delete cascade,
  obs_date    date not null,
  value       numeric(14, 6) not null,
  created_at  timestamptz not null default now(),
  primary key (series_id, obs_date)
);

create index if not exists macro_observations_date_idx on public.macro_observations (obs_date);


-- -----------------------------------------------------------------------------
-- 3. Government debt and deficits (IMF DataMapper). One row per country per year.
--    fiscal_balance_pct_gdp is negative for a deficit (IMF convention).
-- -----------------------------------------------------------------------------
create table if not exists public.country_fiscal (
  country_iso3            text not null check (country_iso3 ~ '^[A-Z]{3}$'),
  year                    integer not null,
  country_name            text not null,
  gross_debt_pct_gdp      numeric(8, 2),
  fiscal_balance_pct_gdp  numeric(8, 2),
  gdp_usd_bn              numeric(14, 2),
  is_projection           boolean not null default false,
  vintage                 text not null,      -- IMF release, e.g. 'October 2026'
  source                  text not null default 'imf',
  retrieved_at            timestamptz not null default now(),
  primary key (country_iso3, year)
);


-- -----------------------------------------------------------------------------
-- 4. Central bank gold reserves. One row per country per month per source,
--    so IMF, WGC (if permitted), and hand-entered rows can coexist.
-- -----------------------------------------------------------------------------
create table if not exists public.central_bank_gold_reserves (
  country_iso3        text not null,          -- ISO code, or IMF area code (e.g. 'U2' = euro area)
  period              date not null,          -- first day of the month the figure refers to
  source              text not null check (source in ('imf', 'wgc', 'manual')),
  country_name        text not null,
  tonnes              numeric(12, 3) not null,
  gold_value_usd      numeric(20, 2),         -- at market price (see pct_of_reserves note)
  total_reserves_usd  numeric(20, 2),         -- official reserve assets, gold at market price
  pct_of_reserves     numeric(7, 3),          -- gold share of total reserves, %
  source_url          text,
  retrieved_at        timestamptz not null default now(),
  primary key (country_iso3, period, source)
);

create index if not exists cb_gold_period_idx on public.central_bank_gold_reserves (period);


-- -----------------------------------------------------------------------------
-- 5. Refresh log: every script appends one row per run
-- -----------------------------------------------------------------------------
create table if not exists public.data_refresh_log (
  id            bigint generated always as identity primary key,
  job           text not null,               -- e.g. 'fred', 'imf_fiscal', 'yahoo_daily'
  ran_at        timestamptz not null default now(),
  status        text not null check (status in ('ok', 'error')),
  rows_written  integer not null default 0,
  message       text
);

create index if not exists data_refresh_log_job_idx on public.data_refresh_log (job, ran_at desc);


-- -----------------------------------------------------------------------------
-- updated_at trigger for macro_series (function created in the initial schema)
-- -----------------------------------------------------------------------------
drop trigger if exists macro_series_set_updated_at on public.macro_series;
create trigger macro_series_set_updated_at before update on public.macro_series
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Security: public read, script write (same pattern as the initial schema)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'macro_series', 'macro_observations', 'country_fiscal',
    'central_bank_gold_reserves', 'data_refresh_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read access" on public.%I', t);
    execute format(
      'create policy "Public read access" on public.%I for select to anon, authenticated using (true)',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;
