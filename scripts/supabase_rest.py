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
