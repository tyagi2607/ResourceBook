# 09 — Data jobs (scripts and schedules)

How the numbers on `/gold` and `/gold/why` get into Supabase, how to run each job by hand, and
how to check that the scheduled runs are healthy.

All jobs are Python scripts in `/scripts`. They read the Supabase URL and **secret** key from
`.env.local` on your machine, or from GitHub secrets when GitHub runs them on a schedule. Pages
only ever read the data; they never call these sources directly.

## The jobs

| Script | Source | Writes to | Schedule | Run by hand |
| --- | --- | --- | --- | --- |
| `etl_yahoo.py` | Yahoo Finance (`yfinance`) | `commodity_daily`, `commodities` (price, 52-week range), `vehicle_daily`, `miner_etf_daily`, `company_daily`, and the current-price columns of `vehicles`, `miner_etfs`, `companies` | Weekdays 22:30 UTC | `python scripts\etl_yahoo.py` |
| `fetch_fred.py` | FRED public CSV (DFII10, DGS10, T10YIE) | `macro_series`, `macro_observations` | Weekdays, right after Yahoo | `python scripts\fetch_fred.py` |
| `fetch_imf_gold_reserves.py` | IMF IRFCL API (gold ounces, gold value, total reserves) | `central_bank_gold_reserves` (`source = 'imf'`) | 10th of each month, 09:00 UTC | `python scripts\fetch_imf_gold_reserves.py` |
| `fetch_imf_fiscal.py` | IMF DataMapper API (debt, deficit, GDP) | `country_fiscal` | 10th of each month, after reserves | `python scripts\fetch_imf_fiscal.py` |
| `load_manual_data.py` | Your CSV in `data/manual/` | The table named on the command line | Never (by hand only) | `python scripts\load_manual_data.py central_bank_gold_reserves` |

On Windows, run them with the project's virtual environment, e.g.
`.venv\Scripts\python.exe scripts\fetch_fred.py`.

### Options

- `etl_yahoo.py --backfill`: loads long history (gold futures since 2003; ETFs, miners, and
  companies for 2 years). Run once. The daily run fetches about 400 days of gold futures (enough
  for the 52-week high and low) and the last 45 days for everything else, so missed days fill in
  automatically.
- `fetch_fred.py --backfill`: loads each series' full history. The daily run fetches the last
  120 days, so a missed day or a FRED revision is picked up automatically.
- `fetch_imf_gold_reserves.py --since 2016`: first year to reload. The default is three years
  back. It deletes our IMF rows from that year onward and reloads them, so rows the cleaning
  rules now skip don't linger.
- All jobs are **safe to re-run**: they upsert (insert or update) on each table's key.

## Every run is logged

Each script ends by writing one row to `data_refresh_log`:

| Column | Meaning |
| --- | --- |
| `job` | `yahoo_daily`, `fred`, `imf_gold_reserves`, `imf_fiscal`, or `manual_<table>` |
| `ran_at` | When it finished |
| `status` | `ok` or `error` |
| `rows_written` | How many rows it upserted |
| `message` | The error text when `status = 'error'` |

The "Updated <date>" lines on `/gold/why` come from the latest `ok` row per job. To spot a broken
job, run this in the Supabase SQL Editor:

```sql
select job, ran_at, status, rows_written, message
from data_refresh_log
order by ran_at desc
limit 20;
```

## Scheduled runs (GitHub Actions)

Two workflow files in `.github/workflows/`:

- `data-daily.yml`: Yahoo, then FRED. FRED runs even if Yahoo failed.
- `data-monthly.yml`: IMF reserves, then IMF fiscal.

Both can also be started by hand: GitHub → the repo → **Actions** → pick the workflow →
**Run workflow**. A failed run shows a red ✗ there, and GitHub emails you.

### One-time setup: add the two secrets

The workflows need the same two values that are in your `.env.local`. Add them in GitHub, never
in code or chat:

1. Open the repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** → name `NEXT_PUBLIC_SUPABASE_URL` → paste the value from
   `.env.local`.
3. **New repository secret** → name `SUPABASE_SECRET_KEY` → paste the `sb_secret_...` value from
   `.env.local`.
4. Go to **Actions** → "Data refresh (daily)" → **Run workflow** to test. It should finish green
   in a few minutes, and a new `yahoo_daily` row appears in `data_refresh_log`.

Schedules only run from the default branch, so the workflows start once these files are pushed
to `main`.

## When the site shows the new data

Pages rebuild at most once an hour (`revalidate = 3600`), so fresh data appears within an hour of
a job finishing. In local development (`npm run dev`) the server can keep an earlier fetch for a
while; restart it if you need to see a reload immediately.

## Data-quality rules (central bank reserves)

The IMF publishes what each country reports. A few reports have unit errors, so the reserves
script cleans them and prints what it did:

| Rule | Example | What the script does |
| --- | --- | --- |
| Gold booked at a historical price | The US values its gold at $42.22/oz | Revalue at that month's market price (the median price implied by other countries' reports) and recompute % of reserves |
| Volume reported 1,000× too large | Brazil, Angola | Divide by 1,000 when the volume and value only agree that way |
| Volume and value contradict each other | Chile 2026, Costa Rica 2016 | Skip that month |
| Stale reporter | Latest report more than 6 months old | Shown nowhere in the tables (filtered when the page loads) |

The page states these transformations under the central bank section, as the IMF's terms
require.

## Known issues

- `ODV` and `SGD.V` (in `data/seed/companies.csv`) aren't found on Yahoo; the ETL prints a
  warning and skips them. Fix the symbols in the seed CSV and re-run `seed_database.py`.
- Yahoo is an unofficial source. Replace it with a licensed feed before any commercial launch
  (the tables stay the same).
