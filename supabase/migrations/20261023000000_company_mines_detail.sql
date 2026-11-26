-- =============================================================================
-- ResourceBook — Companies screener + mine detail (docs/11-gold-companies.md)
-- =============================================================================
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS). Run after initial schema.
--
-- WHAT IT ADDS
--   1. Producer fields on companies (production, cash/debt, NAV, gold price assumptions)
--   2. company_mines     — per-mine fundamentals that roll up to the company
--   3. company_people    — lean Management tab
--   4. company_sources   — filing / IR links
--   5. Extra columns on company_fundamentals_history for snapshots
--
-- Same security model: public SELECT; scripts write with the secret key.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. companies: producer comps + reported-vs-spot assumptions
-- -----------------------------------------------------------------------------
alter table public.companies add column if not exists production_koz numeric(12, 2);
alter table public.companies add column if not exists aisc_gold_price_usd numeric(10, 2);
alter table public.companies add column if not exists cash_musd numeric(14, 2);
alter table public.companies add column if not exists debt_musd numeric(14, 2);
alter table public.companies add column if not exists nav_musd numeric(14, 2);
alter table public.companies add column if not exists nav_gold_price_usd numeric(10, 2);
alter table public.companies add column if not exists nav_as_of date;
alter table public.companies add column if not exists nav_source text;


-- -----------------------------------------------------------------------------
-- 2. company_mines — one row per mine / complex
-- -----------------------------------------------------------------------------
create table if not exists public.company_mines (
  id                   bigint generated always as identity primary key,
  company_symbol       text not null references public.companies (symbol) on delete cascade,
  mine_slug            text not null,
  name                 text not null,
  country              text,
  region               text,
  status               text not null default 'operating'
                         check (status in ('operating', 'construction', 'development', 'care_maintenance')),
  ownership_pct        numeric(7, 2) not null default 100
                         check (ownership_pct > 0 and ownership_pct <= 100),
  production_koz       numeric(12, 2),
  aisc_per_oz          numeric(10, 2),
  aisc_gold_price_usd  numeric(10, 2),
  reserves_pp_moz      numeric(10, 3),
  resources_mi_moz     numeric(10, 3),
  as_of                date,
  source_url           text,
  notes                text,
  sort_order           integer not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (company_symbol, mine_slug)
);

create index if not exists company_mines_company_idx
  on public.company_mines (company_symbol, sort_order);


-- -----------------------------------------------------------------------------
-- 3. company_people — Management tab
-- -----------------------------------------------------------------------------
create table if not exists public.company_people (
  id              bigint generated always as identity primary key,
  company_symbol  text not null references public.companies (symbol) on delete cascade,
  role            text not null check (role in ('ceo', 'cfo', 'coo', 'other')),
  name            text not null,
  since_year      integer,
  notes           text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_symbol, role, name)
);

create index if not exists company_people_company_idx
  on public.company_people (company_symbol, sort_order);


-- -----------------------------------------------------------------------------
-- 4. company_sources — filing / IR links
-- -----------------------------------------------------------------------------
create table if not exists public.company_sources (
  id              bigint generated always as identity primary key,
  company_symbol  text not null references public.companies (symbol) on delete cascade,
  kind            text not null check (kind in ('aif', 'reserves', 'presentation', 'mda', 'other')),
  title           text not null,
  url             text not null,
  as_of           date,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (company_symbol, kind, url)
);

create index if not exists company_sources_company_idx
  on public.company_sources (company_symbol, sort_order);


-- -----------------------------------------------------------------------------
-- 5. Fundamentals history: snapshot the new producer fields too
-- -----------------------------------------------------------------------------
alter table public.company_fundamentals_history
  add column if not exists production_koz numeric(12, 2);
alter table public.company_fundamentals_history
  add column if not exists aisc_gold_price_usd numeric(10, 2);
alter table public.company_fundamentals_history
  add column if not exists nav_musd numeric(14, 2);
alter table public.company_fundamentals_history
  add column if not exists nav_gold_price_usd numeric(10, 2);


-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
drop trigger if exists company_mines_set_updated_at on public.company_mines;
create trigger company_mines_set_updated_at before update on public.company_mines
  for each row execute function public.set_updated_at();

drop trigger if exists company_people_set_updated_at on public.company_people;
create trigger company_people_set_updated_at before update on public.company_people
  for each row execute function public.set_updated_at();

drop trigger if exists company_sources_set_updated_at on public.company_sources;
create trigger company_sources_set_updated_at before update on public.company_sources
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Security: public read, script write
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['company_mines', 'company_people', 'company_sources']
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
