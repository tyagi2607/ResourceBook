"""
seed_database.py — load the starter CSVs in data/seed/ into Supabase.

Run from the repo root (after the schema migration has been applied):
    .venv\\Scripts\\python scripts\\seed_database.py

Safe to re-run: rows are UPSERTed (matched on their key and updated), so editing
a CSV and running this again updates the database instead of duplicating rows.

Load order matters: `commodities` first, because the other tables reference it
(foreign keys), the same way you load dimension tables before fact tables.
"""

from __future__ import annotations

import csv
from pathlib import Path

from supabase_rest import REPO_ROOT, count_rows, upsert_rows

SEED_DIR = REPO_ROOT / "data" / "seed"

# (table, csv file, conflict key used to match existing rows)
SEED_TABLES = [
    ("commodities", "commodities.csv", "slug"),
    ("vehicles", "vehicles.csv", "symbol"),
    ("miner_etfs", "miner_etfs.csv", "symbol"),
    ("companies", "companies.csv", "symbol"),
    ("dealers", "dealers.csv", "name,country"),
]


def read_csv(path: Path) -> list[dict]:
    """
    Read a CSV into a list of dicts.

    Blank cells become None (SQL NULL). "true"/"false" become booleans. Numbers stay
    as text — Postgres converts them to the column's numeric type on insert.
    """
    with path.open(newline="", encoding="utf-8") as handle:
        rows = []
        for raw in csv.DictReader(handle):
            row = {}
            for column, value in raw.items():
                value = (value or "").strip()
                if value == "":
                    row[column] = None
                elif value.lower() in ("true", "false"):
                    row[column] = value.lower() == "true"
                else:
                    row[column] = value
            rows.append(row)
        return rows


def main() -> None:
    print("Seeding Supabase from data/seed/ ...\n")
    for table, filename, conflict_key in SEED_TABLES:
        rows = read_csv(SEED_DIR / filename)
        upsert_rows(table, rows, on_conflict=conflict_key)
        total = count_rows(table, key_kind="secret")
        print(f"  {table:<12} {len(rows):>3} rows from CSV  ->  {total:>3} rows in table")
    print("\nDone. Run scripts\\check_database.py to verify public read access.")


if __name__ == "__main__":
    main()
