"""
fetch_imf_fiscal.py — government debt and deficits (% of GDP) from the IMF.

Feeds the "Debt and deficits" table (docs/08-gold-overview-data-plan.md):
    GGXWDG_NGDP  general government gross debt, % of GDP
    GGXCNL_NGDP  general government net lending/borrowing, % of GDP (negative = deficit)
    NGDPD        GDP in billions of US dollars (only used to rank the "top 10 economies")

Run from the repo root:
    .venv\\Scripts\\python scripts\\fetch_imf_fiscal.py

HOW IT GETS THE DATA
    IMF DataMapper API (no key). One request per indicator, for all countries.
    The IMF updates these twice a year (World Economic Outlook / Fiscal Monitor,
    April and October). Running monthly is harmless: unchanged values are rewritten.

LICENSE
    IMF data may be republished with attribution ("Source: International Monetary
    Fund, ..."). Commercial reuse needs permission from copyright@imf.org.

Safe to re-run: rows are upserted on (country_iso3, year).
"""

from __future__ import annotations

import re
from datetime import date

import requests

from country_names import short_country_name
from supabase_rest import run_job, upsert_in_batches

JOB = "imf_fiscal"
API = "https://www.imf.org/external/datamapper/api/v1"
FIRST_YEAR = 2000

INDICATORS = {
    "GGXWDG_NGDP": "gross_debt_pct_gdp",
    "GGXCNL_NGDP": "fiscal_balance_pct_gdp",
    "NGDPD": "gdp_usd_bn",
}


def get_json(path: str) -> dict:
    response = requests.get(f"{API}/{path}", timeout=120)
    response.raise_for_status()
    return response.json()


def vintage_label(indicator_meta: dict) -> str:
    """'World Economic Outlook (April 2026)' -> 'April 2026'."""
    source = indicator_meta.get("source") or ""
    match = re.search(r"\(([^)]+)\)", source)
    return match.group(1) if match else source or "unknown"


def refresh() -> int:
    countries = get_json("countries")["countries"]  # ISO3 -> {"label": "Aruba"}
    indicator_meta = get_json("indicators")["indicators"]
    vintage = vintage_label(indicator_meta["GGXWDG_NGDP"])
    this_year = date.today().year
    last_year = this_year + 2

    # Pivot: one row per (country, year) with a column per indicator.
    rows: dict[tuple[str, int], dict] = {}
    for code, column in INDICATORS.items():
        values = get_json(code)["values"][code]  # {ISO3: {"2024": 123.0, ...}}
        for iso3, by_year in values.items():
            if iso3 not in countries:  # skip regional aggregates
                continue
            for year_text, value in by_year.items():
                year = int(year_text)
                if not FIRST_YEAR <= year <= last_year or value is None:
                    continue
                row = rows.setdefault(
                    (iso3, year),
                    {
                        "country_iso3": iso3,
                        "year": year,
                        "country_name": short_country_name(iso3, countries[iso3]["label"]),
                        "gross_debt_pct_gdp": None,
                        "fiscal_balance_pct_gdp": None,
                        "gdp_usd_bn": None,
                        # The IMF publishes estimates for the current year and beyond.
                        "is_projection": year >= this_year,
                        "vintage": vintage,
                        "source": "imf",
                    },
                )
                row[column] = round(float(value), 2)

    print(f"  vintage: {vintage}   countries: {len({k[0] for k in rows})}   rows: {len(rows)}")
    for iso3 in ("USA", "JPN", "CHN"):
        sample = rows.get((iso3, this_year))
        if sample:
            print(
                f"  {iso3} {this_year}: debt {sample['gross_debt_pct_gdp']}%  "
                f"balance {sample['fiscal_balance_pct_gdp']}%  GDP ${sample['gdp_usd_bn']}bn"
            )
    return upsert_in_batches("country_fiscal", list(rows.values()), on_conflict="country_iso3,year")


if __name__ == "__main__":
    run_job(JOB, refresh)
