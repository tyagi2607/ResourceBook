-- =============================================================================
-- ResourceBook — initial database schema (Gold Hub MVP)
-- =============================================================================
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS.
--
-- TWO KINDS OF TABLES
--   1. Current-state tables  — one row per instrument, latest values.
--                              Pages read these (tables, screeners, stats bars).
--   2. Daily history tables  — one row per instrument per day.
--                              Charts read these (premium/discount over time, etc.).
--
--   The daily Yahoo ETL (a later step) UPSERTs current-state rows and INSERTs one
--   history row per day. Fundamentals (AISC, NPV, ...) come from curated CSVs.
--
-- NAMING CONVENTIONS
--   symbol      = Yahoo Finance symbol, used as the primary key and by the ETL
--                 (e.g. 'GLD', 'PHYS.TO', 'CGL-C.TO'). Unique across exchanges.
--   ticker      = what the user sees (e.g. 'PHYS', 'CGL.C').
--   *_pct       = percent as a number: 1.25 means 1.25 %.
--   expense_ratio = fraction: 0.0040 means 0.40 %.
--   *_musd      = millions of US dollars.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helper: keep `updated_at` current whenever a row is updated
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 1. CURRENT-STATE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- commodities — one row per commodity hub (gold, silver, ...)
-- -----------------------------------------------------------------------------
create table if not exists public.commodities (
  slug          text primary key check (slug ~ '^[a-z-]+$'),  -- matches the URL: /gold
  name          text not null,
  status        text not null default 'coming_soon'
                  check (status in ('live', 'coming_soon')),
  spot_symbol   text,               -- Yahoo symbol for the price feed, e.g. 'GC=F'
  price_unit    text,               -- e.g. 'USD/oz'
  price         numeric(14, 4),     -- latest close
  change_pct    numeric(9, 4),      -- 1-day % change
  high_52w      numeric(14, 4),
  low_52w       numeric(14, 4),
  price_as_of   timestamptz,        -- when the ETL last fetched the price
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- vehicles — metal-backed ETFs, trusts, and receipts (Physical page)
-- These hold the metal itself. Miner equity ETFs live in `miner_etfs`.
-- -----------------------------------------------------------------------------
create table if not exists public.vehicles (
  symbol               text primary key,
  ticker               text not null,
  commodity_slug       text not null references public.commodities (slug),
  name                 text not null,
  issuer               text,
  structure            text not null check (structure in ('etf', 'trust', 'receipt')),
  exchange             text not null,
  country              text not null check (country in ('US', 'CA')),   -- drives the CA/US filter
  currency             text not null check (currency in ('USD', 'CAD')),
  expense_ratio        numeric(6, 5) check (expense_ratio >= 0 and expense_ratio < 0.05),
  vault_location       text,
  physical_redemption  boolean not null default false,
  website              text,

  -- Market data (filled by the ETL)
  market_price         numeric(14, 4),
  nav_per_share        numeric(14, 4),
  -- Computed by Postgres: never written directly. NULL when NAV is unknown.
  premium_discount_pct numeric(9, 4) generated always as (
    case
      when nav_per_share > 0 and market_price is not null
        then round((market_price - nav_per_share) / nav_per_share * 100, 4)
    end
  ) stored,
  aum                  numeric(18, 2),   -- assets under management, listing currency
  change_pct           numeric(9, 4),
  price_as_of          timestamptz,
  nav_as_of            date,

  notes                text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists vehicles_commodity_country_idx
  on public.vehicles (commodity_slug, country);

-- -----------------------------------------------------------------------------
-- miner_etfs — ETFs that hold mining COMPANIES (Companies page, Miner ETFs tab)
-- -----------------------------------------------------------------------------
create table if not exists public.miner_etfs (
  symbol            text primary key,
  ticker            text not null,
  commodity_slug    text not null references public.commodities (slug),
  name              text not null,
  issuer            text,
  focus             text not null check (focus in ('majors', 'juniors', 'explorers', 'broad')),
  exchange          text not null,
  country           text not null check (country in ('US', 'CA')),
  currency          text not null check (currency in ('USD', 'CAD')),
  expense_ratio     numeric(6, 5) check (expense_ratio >= 0 and expense_ratio < 0.05),
  holdings_summary  text,
  website           text,

  market_price      numeric(14, 4),
  aum               numeric(18, 2),
  change_pct        numeric(9, 4),
  price_as_of       timestamptz,

  notes             text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists miner_etfs_commodity_country_idx
  on public.miner_etfs (commodity_slug, country);

-- -----------------------------------------------------------------------------
-- companies — individual equities, grouped by Lassonde curve tier
-- Market fields come from the ETL; fundamentals come from curated CSVs.
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  symbol               text primary key,
  ticker               text not null,
  commodity_slug       text not null references public.commodities (slug),
  name                 text not null,
  tier                 text not null
                         check (tier in ('royalty', 'producer', 'developer', 'explorer')),
  exchange             text not null,
  country              text not null check (country in ('US', 'CA')),  -- listing country
  currency             text not null check (currency in ('USD', 'CAD')),
  hq_country           text,
  primary_asset        text,
  asset_location       text,
  jurisdiction_risk    text check (jurisdiction_risk in ('Tier 1', 'Tier 2', 'Tier 3')),
  study_stage          text check (study_stage in ('PEA', 'PFS', 'FS')),  -- developers
  website              text,

  -- Market data (filled by the ETL)
  market_price         numeric(14, 4),
  market_cap           numeric(18, 2),   -- listing currency
  change_pct           numeric(9, 4),
  price_as_of          timestamptz,

  -- Fundamentals (curated; latest values — history lives in company_fundamentals_history)
  aisc_per_oz          numeric(10, 2),   -- producers
  reserves_moz         numeric(10, 3),   -- proven + probable, million oz
  npv_5pct_musd        numeric(14, 2),   -- developers
  irr_pct              numeric(7, 2),    -- developers
  initial_capex_musd   numeric(14, 2),   -- developers
  cash_runway_months   numeric(6, 1),    -- explorers
  latest_assay         text,             -- explorers, e.g. '5.4 g/t Au over 32 m'
  fundamentals_as_of   date,
  fundamentals_source  text,             -- link or filing name

  metadata             jsonb not null default '{}'::jsonb,  -- flexible extras
  notes                text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists companies_commodity_tier_idx
  on public.companies (commodity_slug, tier);

-- -----------------------------------------------------------------------------
-- dealers — curated physical bullion dealers (Physical page, filtered by country)
-- -----------------------------------------------------------------------------
create table if not exists public.dealers (
  id          bigint generated always as identity primary key,
  name        text not null,
  website     text not null,
  country     text not null check (country in ('US', 'CA')),
  hq_city     text,
  sells       text,                          -- e.g. 'Coins, bars, rounds'
  online      boolean not null default true,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (name, country)                     -- lets the seed script upsert safely
);


-- =============================================================================
-- 2. DAILY HISTORY TABLES (one row per instrument per day)
-- =============================================================================

create table if not exists public.commodity_daily (
  commodity_slug  text not null references public.commodities (slug) on delete cascade,
  as_of_date      date not null,
  close_price     numeric(14, 4) not null,
  source          text not null default 'yahoo',
  created_at      timestamptz not null default now(),
  primary key (commodity_slug, as_of_date)
);

create table if not exists public.vehicle_daily (
  symbol                text not null references public.vehicles (symbol) on delete cascade,
  as_of_date            date not null,
  close_price           numeric(14, 4) not null,
  nav_per_share         numeric(14, 4),
  premium_discount_pct  numeric(9, 4) generated always as (
    case
      when nav_per_share > 0
        then round((close_price - nav_per_share) / nav_per_share * 100, 4)
    end
  ) stored,
  volume                bigint,
  source                text not null default 'yahoo',
  created_at            timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

create table if not exists public.miner_etf_daily (
  symbol       text not null references public.miner_etfs (symbol) on delete cascade,
  as_of_date   date not null,
  close_price  numeric(14, 4) not null,
  volume       bigint,
  source       text not null default 'yahoo',
  created_at   timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

create table if not exists public.company_daily (
  symbol       text not null references public.companies (symbol) on delete cascade,
  as_of_date   date not null,
  close_price  numeric(14, 4) not null,
  market_cap   numeric(18, 2),
  volume       bigint,
  source       text not null default 'yahoo',
  created_at   timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

-- Fundamentals change quarterly, not daily: one row each time a value is updated.
create table if not exists public.company_fundamentals_history (
  symbol              text not null references public.companies (symbol) on delete cascade,
  as_of_date          date not null,
  aisc_per_oz         numeric(10, 2),
  reserves_moz        numeric(10, 3),
  npv_5pct_musd       numeric(14, 2),
  irr_pct             numeric(7, 2),
  cash_runway_months  numeric(6, 1),
  source              text,
  created_at          timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

-- Charts filter history by date range; these indexes keep that fast.
create index if not exists commodity_daily_date_idx on public.commodity_daily (as_of_date);
create index if not exists vehicle_daily_date_idx   on public.vehicle_daily (as_of_date);
create index if not exists miner_etf_daily_date_idx on public.miner_etf_daily (as_of_date);
create index if not exists company_daily_date_idx   on public.company_daily (as_of_date);


-- =============================================================================
-- 3. updated_at TRIGGERS (current-state tables only)
-- =============================================================================
do $$
declare
  t text;
begin
  foreach t in array array['commodities', 'vehicles', 'miner_etfs', 'companies', 'dealers']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end $$;


-- =============================================================================
-- 4. SECURITY — public can READ everything, only the ETL (secret key) can WRITE
-- =============================================================================
--   Row Level Security (RLS) is on for every table.
--   Visitors use the publishable key (roles: anon / authenticated) -> SELECT only.
--   Scripts use the secret key (role: service_role) -> bypasses RLS, can write.
do $$
declare
  t text;
begin
  foreach t in array array[
    'commodities', 'vehicles', 'miner_etfs', 'companies', 'dealers',
    'commodity_daily', 'vehicle_daily', 'miner_etf_daily', 'company_daily',
    'company_fundamentals_history'
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
