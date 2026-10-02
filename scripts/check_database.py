"""
check_database.py — verify the database is set up the way the website expects.

Run from the repo root:
    .venv\\Scripts\\python scripts\\check_database.py

Checks, using the PUBLISHABLE key (the same access a website visitor has):
  1. Every table can be read, and seeded tables have rows.
  2. Writes are blocked — a visitor must not be able to insert data.
"""

from __future__ import annotations

import sys

import requests

from supabase_rest import count_rows, headers, table_url

SEEDED_TABLES = ["commodities", "vehicles", "miner_etfs", "companies", "dealers"]
HISTORY_TABLES = [
    "commodity_daily",
    "vehicle_daily",
    "miner_etf_daily",
    "company_daily",
    "company_fundamentals_history",
]


def main() -> None:
    problems = []

    print("1. Public read access (publishable key)\n")
    for table in SEEDED_TABLES + HISTORY_TABLES:
        total = count_rows(table, key_kind="publishable")
        expected_rows = table in SEEDED_TABLES
        status = "ok" if (total > 0 or not expected_rows) else "EMPTY"
        if status != "ok":
            problems.append(f"{table} has no rows visible to the public")
        note = "" if expected_rows else "  (history fills once the daily ETL runs)"
        print(f"  {status:<6} {table:<30} {total:>3} rows{note}")

    print("\n2. Public writes are blocked\n")
    response = requests.post(
        table_url("dealers"),
        headers={**headers("publishable"), "Prefer": "return=minimal"},
        json={"name": "RLS test", "website": "https://example.com", "country": "US"},
        timeout=30,
    )
    if response.ok:
        problems.append("the publishable key was able to INSERT into dealers")
        print("  FAIL   insert succeeded — Row Level Security is not protecting writes")
    else:
        print(f"  ok     insert rejected (HTTP {response.status_code}) as expected")

    if problems:
        print("\nProblems found:")
        for problem in problems:
            print(f"  - {problem}")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
