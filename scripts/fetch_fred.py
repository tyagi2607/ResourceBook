"""
fetch_fred.py — US interest-rate series from FRED into Supabase.

Feeds the "Real rates" section (docs/08-gold-overview-data-plan.md):
    DFII10  real 10-year yield (TIPS)        <- the number gold watchers track
    DGS10   nominal 10-year Treasury yield
    T10YIE  10-year breakeven inflation      (= DGS10 - DFII10, by construction)

Run from the repo root:
    .venv\\Scripts\\python scripts\\fetch_fred.py              # last 120 days (daily job)
    .venv\\Scripts\\python scripts\\fetch_fred.py --backfill   # full history (run once)

HOW IT GETS THE DATA
    FRED's public CSV download (the same file as the "Download" button on each series
    page). No API key needed. Missing days (holidays) are blank and are skipped.

LICENSE
    These three series are published by the Federal Reserve Board and are free to
    reuse. FRED asks for a citation, stored in macro_series.citation and shown on the page.

Safe to re-run: rows are upserted on (series_id, obs_date).
"""

from __future__ import annotations

import argparse
import csv
import io
from datetime import date, timedelta

import requests

from supabase_rest import run_job, upsert_in_batches, upsert_rows

JOB = "fred"
CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"

# FRED citation format: <source>, <title> [<id>], retrieved from FRED, Federal Reserve
# Bank of St. Louis; <url>
SERIES = [
    {
        "series_id": "DFII10",
        "title": "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis, Inflation-Indexed",
        "units": "Percent",
        "frequency": "Daily",
    },
    {
        "series_id": "DGS10",
        "title": "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis",
        "units": "Percent",
        "frequency": "Daily",
    },
    {
        "series_id": "T10YIE",
        "title": "10-Year Breakeven Inflation Rate",
        "units": "Percent",
        "frequency": "Daily",
    },
]

# Who publishes each series (used in the citation).
PUBLISHER = {
    "DFII10": "Board of Governors of the Federal Reserve System (US)",
    "DGS10": "Board of Governors of the Federal Reserve System (US)",
    "T10YIE": "Federal Reserve Bank of St. Louis",
}


def series_row(series: dict) -> dict:
    series_id = series["series_id"]
    url = f"https://fred.stlouisfed.org/series/{series_id}"
    citation = (
        f"{PUBLISHER[series_id]}, {series['title']} [{series_id}], retrieved from FRED, "
        f"Federal Reserve Bank of St. Louis; {url}"
    )
    return {**series, "source": "FRED", "source_url": url, "citation": citation}


def fetch_observations(series_id: str, start: date | None) -> list[dict]:
    """Download one series as CSV and return [{series_id, obs_date, value}, ...]."""
    params = {"id": series_id}
    if start:
        params["cosd"] = start.isoformat()  # "chart observation start date"
    response = requests.get(CSV_URL, params=params, timeout=60)
    response.raise_for_status()

    rows = []
    for record in csv.DictReader(io.StringIO(response.text)):
        value = (record.get(series_id) or "").strip()
        if value in ("", "."):  # FRED marks missing days with "." or blank
            continue
        rows.append(
            {
                "series_id": series_id,
                "obs_date": record["observation_date"],
                "value": float(value),
            }
        )
    return rows


def refresh(start: date | None) -> int:
    upsert_rows("macro_series", [series_row(s) for s in SERIES], on_conflict="series_id")
    total = 0
    for series in SERIES:
        rows = fetch_observations(series["series_id"], start)
        total += upsert_in_batches("macro_observations", rows, on_conflict="series_id,obs_date")
        latest = rows[-1] if rows else None
        print(
            f"  {series['series_id']:<7} {len(rows):>6} rows"
            + (f"   latest {latest['obs_date']} = {latest['value']}" if latest else "")
        )
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="US rate series from FRED into Supabase")
    parser.add_argument("--backfill", action="store_true", help="load full history")
    args = parser.parse_args()
    start = None if args.backfill else date.today() - timedelta(days=120)
    run_job(JOB, lambda: refresh(start))


if __name__ == "__main__":
    main()
