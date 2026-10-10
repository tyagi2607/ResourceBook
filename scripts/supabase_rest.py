"""
supabase_rest.py — tiny shared helper for talking to Supabase from Python.

Supabase exposes every table as a REST endpoint:
    https://<project>.supabase.co/rest/v1/<table>

We call it with plain HTTP (the `requests` library) instead of an SDK so every
request is visible and easy to debug. Keys are read from `.env.local` at the
repo root, the same file the Next.js app uses. Keys are never printed.

Two keys, two roles:
    publishable key -> read-only (what website visitors get)
    secret key      -> full write access, bypasses Row Level Security (scripts only)
"""

from __future__ import annotations

import os
import sys
from collections.abc import Callable
from pathlib import Path

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(REPO_ROOT / ".env.local")


def _require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value or "..." in value or "your-project" in value:
        sys.exit(
            f"Missing {name}. Open .env.local at the repo root and paste the value "
            "from Supabase -> Project Settings -> API Keys."
        )
    return value


def supabase_url() -> str:
    return _require_env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")


def headers(key_kind: str) -> dict[str, str]:
    """
    Build request headers for either the 'publishable' or 'secret' key.

    New-style keys (sb_publishable_... / sb_secret_...) go in the `apikey` header only.
    Legacy JWT keys (start with 'eyJ') also need an Authorization header.
    """
    env_name = (
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        if key_kind == "publishable"
        else "SUPABASE_SECRET_KEY"
    )
    key = _require_env(env_name)
    result = {"apikey": key, "Content-Type": "application/json"}
    if key.startswith("eyJ"):
        result["Authorization"] = f"Bearer {key}"
    return result


def table_url(table: str) -> str:
    return f"{supabase_url()}/rest/v1/{table}"


def upsert_rows(table: str, rows: list[dict], on_conflict: str) -> None:
    """Insert rows, or update them if a row with the same key already exists."""
    response = requests.post(
        table_url(table),
        params={"on_conflict": on_conflict},
        headers={
            **headers("secret"),
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=30,
    )
    if not response.ok:
        sys.exit(f"Upsert into {table} failed ({response.status_code}): {response.text}")


def upsert_in_batches(
    table: str, rows: list[dict], on_conflict: str, batch_size: int = 1000
) -> int:
    """Upsert a large list in chunks (one HTTP request per chunk). Returns rows sent."""
    for start in range(0, len(rows), batch_size):
        upsert_rows(table, rows[start : start + batch_size], on_conflict)
    return len(rows)


def delete_rows(table: str, filters: dict[str, str]) -> None:
    """
    DELETE with PostgREST filters, e.g. delete_rows("t", {"source": "eq.imf"}).
    PostgREST refuses a DELETE with no filter, which guards against wiping a table.
    """
    if not filters:
        sys.exit("delete_rows needs at least one filter")
    response = requests.delete(
        table_url(table),
        params=filters,
        headers={**headers("secret"), "Prefer": "return=minimal"},
        timeout=60,
    )
    if not response.ok:
        sys.exit(f"Delete from {table} failed ({response.status_code}): {response.text}")


def select_rows(table: str, params: dict[str, str]) -> list[dict]:
    """
    Read rows using PostgREST filters, e.g.
        select_rows("vehicles", {"select": "symbol", "is_active": "eq.true"})
    is the same as SELECT symbol FROM vehicles WHERE is_active = true.
    """
    response = requests.get(
        table_url(table), params=params, headers=headers("secret"), timeout=30
    )
    if not response.ok:
        sys.exit(f"Reading {table} failed ({response.status_code}): {response.text}")
    return response.json()


def update_row(table: str, match: dict[str, str], values: dict) -> None:
    """
    UPDATE one existing row, e.g. update_row("commodities", {"slug": "gold"}, {...}).
    Unlike upsert, this never inserts, so required columns we don't send are left alone.
    """
    response = requests.patch(
        table_url(table),
        params={column: f"eq.{value}" for column, value in match.items()},
        headers={**headers("secret"), "Prefer": "return=minimal"},
        json=values,
        timeout=30,
    )
    if not response.ok:
        sys.exit(f"Update of {table} failed ({response.status_code}): {response.text}")


def log_refresh(job: str, status: str, rows_written: int, message: str = "") -> None:
    """Append one row to data_refresh_log so the site can show "Updated <date>"."""
    response = requests.post(
        table_url("data_refresh_log"),
        headers={**headers("secret"), "Prefer": "return=minimal"},
        json={"job": job, "status": status, "rows_written": rows_written, "message": message or None},
        timeout=30,
    )
    if not response.ok:
        print(f"  (warning) could not write data_refresh_log: {response.text}")


def run_job(job: str, work: Callable[[], int]) -> None:
    """
    Run a script's main work and record the outcome in data_refresh_log.
    `work` returns the number of rows written. Failures are logged, then re-raised
    so the command (and a scheduled GitHub Action) still shows as failed.
    """
    try:
        rows = work()
    except BaseException as error:  # includes sys.exit() from the helpers above
        log_refresh(job, "error", 0, str(error)[:500])
        raise
    log_refresh(job, "ok", rows)
    print(f"Done: {rows} rows written ({job}).")


def count_rows(table: str, key_kind: str) -> int:
    """Return the number of rows in a table, as seen by the given key."""
    response = requests.get(
        table_url(table),
        params={"select": "*", "limit": "1"},
        headers={**headers(key_kind), "Prefer": "count=exact"},
        timeout=30,
    )
    if not response.ok:
        sys.exit(f"Reading {table} failed ({response.status_code}): {response.text}")
    # Content-Range looks like "0-0/12" — the number after "/" is the total.
    return int(response.headers.get("Content-Range", "*/0").split("/")[-1])
