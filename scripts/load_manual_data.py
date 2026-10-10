"""
load_manual_data.py — load a hand-edited CSV from data/manual/ into Supabase.

The "Excel-first" path from docs/08-gold-overview-data-plan.md: edit the CSV in Excel
(save as CSV), then run:
    .venv\\Scripts\\python scripts\\load_manual_data.py central_bank_gold_reserves

The file name must match the table name. Rows are upserted on the table's key, so
re-running after an edit updates rows instead of duplicating them.

Hand-entered central bank rows use source = "manual" and live alongside the IMF rows;
the page prefers IMF rows and uses manual ones for countries the IMF doesn't cover.
"""

from __future__ import annotations

import argparse
import sys

from seed_database import read_csv
from supabase_rest import REPO_ROOT, run_job, upsert_in_batches

MANUAL_DIR = REPO_ROOT / "data" / "manual"

# table -> conflict key (must match the table's primary key)
TABLE_KEYS = {
    "central_bank_gold_reserves": "country_iso3,period,source",
    "country_fiscal": "country_iso3,year",
    "macro_observations": "series_id,obs_date",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Load data/manual/<table>.csv into Supabase")
    parser.add_argument("table", choices=sorted(TABLE_KEYS))
    args = parser.parse_args()

    path = MANUAL_DIR / f"{args.table}.csv"
    if not path.exists():
        sys.exit(f"Not found: {path}")
    rows = read_csv(path)
    if not rows:
        sys.exit(f"{path.name} has a header but no rows yet; nothing to load.")
    run_job(
        f"manual_{args.table}",
        lambda: upsert_in_batches(args.table, rows, on_conflict=TABLE_KEYS[args.table]),
    )


if __name__ == "__main__":
    main()
