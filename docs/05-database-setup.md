# 05 — Database setup (Supabase)

How to connect a fresh Supabase project to ResourceBook, create the tables, and load
the starter data. Do this once per Supabase project. It takes about 10 minutes.

## The big picture

```
data/seed/*.csv  ──(scripts/seed_database.py, secret key)──►  Supabase Postgres
                                                                   │
Next.js pages  ◄──(src/lib/supabase/server.ts, publishable key)────┘   read-only
```

- **Schema** (table definitions) lives in `supabase/migrations/20261002000000_initial_schema.sql`.
- **Starter data** lives in `data/seed/*.csv`. Edit these in Excel; re-run the seed script.
- **Writes** happen only from Python scripts in `/scripts` using the **secret** key.
- **The website** only reads, using the **publishable** key. Row Level Security (RLS)
  enforces this inside the database, so a leaked publishable key can't modify data.

## Step 1 — Copy your keys into `.env.local`

`.env.local` sits at the repo root and is ignored by git (it never gets committed).
A template with placeholders is already there (copied from `.env.example`).

In the Supabase dashboard:

1. **Project URL**: Project Settings → **Data API** (or the **Connect** button at the top) →
   copy the URL, e.g. `https://abcdefghijkl.supabase.co`.
2. **Keys**: Project Settings → **API Keys**:
   - **Publishable key** (`sb_publishable_...`)
   - **Secret key** (`sb_secret_...`). Click *Reveal* / create one if needed.

Paste them into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxx
```

> Never paste the secret key into chat, screenshots, or any file other than `.env.local`.
> If it leaks, delete it in Supabase → API Keys and create a new one.

Older projects may only show **legacy** `anon` / `service_role` keys (long strings starting
with `eyJ`). They also work: put `anon` in the publishable slot and `service_role` in the
secret slot. Supabase is retiring legacy keys at the end of 2026, so prefer the new ones.

## Step 2 — Create the tables

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261002000000_initial_schema.sql` in Cursor, copy **all** of it.
3. Paste into the SQL editor → **Run**.
   - Supabase may show **"Potential issues detected"**. Choose **Run and enable RLS**.
     Both warnings are false alarms here. "Destructive operations" refers to
     `drop ... if exists` / `revoke`, which only replace this file's own triggers and
     policies. "Without RLS" appears because RLS is enabled inside a loop (section 4)
     that the checker can't read.
4. You should see *Success. No rows returned*. Check **Table Editor**: 10 tables appear.

The file is safe to re-run. It only creates things that don't exist yet and refreshes
the security policies.

## Step 3 — Load the starter data

From the repo root in a terminal:

```powershell
.venv\Scripts\python scripts\seed_database.py
```

Expected output (counts will change as you edit the CSVs):

```
  commodities    7 rows from CSV  ->    7 rows in table
  vehicles      12 rows from CSV  ->   12 rows in table
  miner_etfs     9 rows from CSV  ->    9 rows in table
  companies     15 rows from CSV  ->   15 rows in table
  dealers        9 rows from CSV  ->    9 rows in table
```

## Step 4 — Verify security and read access

```powershell
.venv\Scripts\python scripts\check_database.py
```

This reads every table with the **publishable** key (the same access a visitor has) and
tries one insert, which **must be rejected**. It ends with `All checks passed.`

## Editing data later

1. Edit the CSV in `data/seed/` (keep the header row; leave a cell blank for "unknown").
2. Re-run `seed_database.py`. Rows are matched by their key (`symbol`, `slug`, or
   `name + country` for dealers) and updated in place. Nothing is duplicated.

Removing a row from a CSV does **not** delete it from the database. To hide something,
set `is_active` to `false` (add the column to the CSV) or delete the row in Table Editor.

## First-time Python setup (already done on this machine)

The scripts run inside a virtual environment (`.venv/`, ignored by git):

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r scripts\requirements.txt
```

## Troubleshooting

| Message | Fix |
| --- | --- |
| `Missing SUPABASE_SECRET_KEY` | `.env.local` still has placeholder values. |
| `relation "public.vehicles" does not exist` | Run the migration (Step 2) first. |
| `Upsert into vehicles failed (409)` / foreign key error | A `commodity_slug` in the CSV isn't in `commodities.csv`. |
| `invalid input value` / check constraint | A value is outside the allowed list (see [06 — Data model](./06-data-model.md)). |
| `Invalid API key` (401) | Key copied incompletely, or URL and key are from different projects. |
