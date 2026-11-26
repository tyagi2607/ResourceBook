-- =============================================================================
-- ResourceBook — Company dual P/NAV (mine DCF / company proxy)
-- =============================================================================
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   Safe to re-run. Apply after 20261023000000_company_mines_detail.sql.
--
-- WHAT IT ADDS
--   1. Mine DCF inputs (recoverable reserves)
--   2. Company discount_rate, tax_rate, shares, dual computed NAV / P/NAV
--   3. company_nav_daily history for charts
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. company_mines: recoverable ounces for life / NPV
-- -----------------------------------------------------------------------------
alter table public.company_mines
  add column if not exists recoverable_reserves_koz numeric(14, 3);


-- -----------------------------------------------------------------------------
-- 2. companies: DCF knobs + stored dual NAV / P/NAV
-- -----------------------------------------------------------------------------
alter table public.companies
  add column if not exists shares_outstanding_m numeric(14, 4);
alter table public.companies
  add column if not exists discount_rate numeric(8, 6) not null default 0.05;
alter table public.companies
  add column if not exists tax_rate numeric(8, 6) not null default 0.30;

alter table public.companies
  add column if not exists nav_baseline_musd numeric(14, 2);
alter table public.companies
  add column if not exists nav_close_musd numeric(14, 2);
alter table public.companies
  add column if not exists gold_baseline_usd numeric(10, 2);
alter table public.companies
  add column if not exists gold_close_usd numeric(10, 2);
alter table public.companies
  add column if not exists pnav_baseline numeric(12, 4);
alter table public.companies
  add column if not exists pnav_close numeric(12, 4);
alter table public.companies
  add column if not exists nav_computed_as_of date;
alter table public.companies
  add column if not exists nav_method text;


-- -----------------------------------------------------------------------------
-- 3. Daily NAV history (upserted by compute_company_nav.py)
-- -----------------------------------------------------------------------------
create table if not exists public.company_nav_daily (
  symbol              text not null references public.companies (symbol) on delete cascade,
  as_of_date          date not null,
  gold_close_usd      numeric(10, 2) not null,
  gold_baseline_usd   numeric(10, 2) not null,
  nav_close_musd      numeric(14, 2),
  nav_baseline_musd   numeric(14, 2),
  pnav_close          numeric(12, 4),
  pnav_baseline       numeric(12, 4),
  nav_method          text,
  source              text not null default 'mine_dcf_v1',
  created_at          timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

create index if not exists company_nav_daily_as_of_idx
  on public.company_nav_daily (as_of_date desc);


-- -----------------------------------------------------------------------------
-- Security: public read, script write
-- -----------------------------------------------------------------------------
alter table public.company_nav_daily enable row level security;

drop policy if exists "Public read access" on public.company_nav_daily;
create policy "Public read access" on public.company_nav_daily
  for select to anon, authenticated using (true);

grant select on public.company_nav_daily to anon, authenticated;
revoke insert, update, delete on public.company_nav_daily from anon, authenticated;
grant all on public.company_nav_daily to service_role;
