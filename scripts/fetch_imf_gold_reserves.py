"""
fetch_imf_gold_reserves.py — official gold reserves by country, monthly, from the IMF.

Feeds the "Central bank gold" section (docs/08-gold-overview-data-plan.md).

Run from the repo root:
    .venv\\Scripts\\python scripts\\fetch_imf_gold_reserves.py              # last 3 years
    .venv\\Scripts\\python scripts\\fetch_imf_gold_reserves.py --since 2010 # more history

SOURCE
    IMF "International Reserves and Foreign Currency Liquidity" (IRFCL), via the IMF
    SDMX data API. Three monthly indicators per country:
        IRFCL56V_FTO  gold volume, fine troy ounces
        IRFCL56_USD   gold value, US dollars (as the country books it)
        IRFCL65_USD   official reserve assets, total, US dollars
    One request per run (all countries at once), so this is not "bulk" scraping.

TRANSFORMATIONS (stated on the page, as the IMF terms require)
    - Tonnes = troy ounces / 32,150.7466
    - Market value: a few countries (notably the US, at $42.22/oz) book gold at an
      old statutory price. To compare countries fairly we revalue every country's gold
      at that month's market price, estimated as the median $/oz across all reporters.
      Total reserves are adjusted by the same difference, then
          pct_of_reserves = gold at market / total reserves at market * 100
    - Unit checks: a few countries report the volume in the wrong unit. See
      fix_reported_ounces() for how those are detected and corrected.

LICENSE
    IMF data may be republished with attribution. Commercial reuse: copyright@imf.org.

Safe to re-run: IMF rows from --since onward are replaced with the fresh download.
"""

from __future__ import annotations

import argparse
import csv
import io
import statistics
from collections import defaultdict
from datetime import date

import requests

from country_names import short_country_name
from supabase_rest import delete_rows, run_job, upsert_in_batches

JOB = "imf_gold_reserves"
TROY_OUNCES_PER_TONNE = 32150.7466
SOURCE_URL = "https://data.imf.org/"

GOLD_OZ = "IRFCLDT1_IRFCL56V_FTO"
GOLD_USD = "IRFCLDT1_IRFCL56_USD"
TOTAL_USD = "IRFCLDT1_IRFCL65_USD"
DATA_URL = (
    "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/+/"
    f"*.{GOLD_OZ}+{GOLD_USD}+{TOTAL_USD}.*.M"
)
# Sector codes: S1XS1311 = monetary authorities + central government (preferred),
# S1X = monetary authorities only. Use the first one a country reports.
SECTOR_PREFERENCE = ["S1XS1311", "S1X"]

COUNTRY_NAMES_URL = "https://www.imf.org/external/datamapper/api/v1/countries"
# IRFCL also reports for a few areas that aren't countries.
EXTRA_NAMES = {"U2": "Euro area (ECB)", "1C_ALL": "IMF"}


def fetch_country_names() -> dict[str, str]:
    response = requests.get(COUNTRY_NAMES_URL, timeout=60)
    response.raise_for_status()
    names = {
        iso3: short_country_name(iso3, info["label"])
        for iso3, info in response.json()["countries"].items()
    }
    return {**names, **EXTRA_NAMES}


def fetch_irfcl(since_year: int) -> list[dict]:
    response = requests.get(
        DATA_URL,
        headers={"Accept": "text/csv"},
        params={"c[TIME_PERIOD]": f"ge:{since_year}-M01"},
        timeout=180,
    )
    response.raise_for_status()
    return list(csv.DictReader(io.StringIO(response.text)))


def period_to_date(period: str) -> date:
    """'2026-M08' -> date(2026, 8, 1)."""
    year, month = period.split("-M")
    return date(int(year), int(month), 1)


_corrections_printed: set[str] = set()


def fix_reported_ounces(
    country: str, period: str, item: dict, market_price: float | None
) -> float | None:
    """
    Catch unit mistakes in the reported volume by comparing the implied price per
    ounce (reported value / reported ounces) with the month's market price:

      ~1/1000 of market  -> volume was reported 1000x too large (e.g. Brazil, Angola):
                            divide by 1000
      well above market  -> volume and value contradict each other and we can't tell
                            which is wrong (e.g. Chile from Feb 2026): return None to
                            skip the month rather than guess
      anything else      -> trust the ounces (low implied prices are countries that
                            book gold at a historical price, e.g. the US at $42.22)
    """
    ounces, book = item["ounces"], item["book_usd"]
    if not market_price or not book:
        return ounces
    ratio = (book / ounces) / market_price
    fixed, reason = ounces, None
    if 0.0005 < ratio < 0.002:
        fixed, reason = ounces / 1000, "corrected: volume reported 1000x too large"
    elif ratio > 1.5:
        fixed, reason = None, "skipped: reported volume and value contradict each other"
    if reason and country not in _corrections_printed:
        _corrections_printed.add(country)
        print(f"  ({reason}) {country}, e.g. {period}")
    return fixed


def build_rows(records: list[dict], names: dict[str, str]) -> list[dict]:
    # values[(country, period)][indicator][sector] = number
    values: dict[tuple[str, str], dict[str, dict[str, float]]] = defaultdict(lambda: defaultdict(dict))
    for record in records:
        raw = (record.get("OBS_VALUE") or "").strip()
        if not raw:
            continue
        key = (record["COUNTRY"], record["TIME_PERIOD"])
        values[key][record["INDICATOR"]][record["SECTOR"]] = float(raw)

    def pick(by_sector: dict[str, float]) -> float | None:
        for sector in SECTOR_PREFERENCE:
            if sector in by_sector:
                return by_sector[sector]
        return next(iter(by_sector.values()), None)

    # First pass: the reported numbers per country-month.
    reported = {}
    for (country, period), by_indicator in values.items():
        ounces = pick(by_indicator.get(GOLD_OZ, {}))
        if not ounces or ounces <= 0 or country not in names:
            continue
        reported[(country, period)] = {
            "ounces": ounces,
            "book_usd": pick(by_indicator.get(GOLD_USD, {})),
            "total_usd": pick(by_indicator.get(TOTAL_USD, {})),
        }

    # Market price per month = median implied $/oz across reporters.
    implied: dict[str, list[float]] = defaultdict(list)
    for (_, period), item in reported.items():
        if item["book_usd"]:
            implied[period].append(item["book_usd"] / item["ounces"])
    market_price = {period: statistics.median(prices) for period, prices in implied.items()}

    rows = []
    for (country, period), item in reported.items():
        price = market_price.get(period)
        ounces = fix_reported_ounces(country, period, item, price)
        if ounces is None:
            continue
        gold_market = ounces * price if price else None
        total_market = None
        if gold_market is not None and item["total_usd"] is not None:
            total_market = item["total_usd"] - (item["book_usd"] or 0) + gold_market
        rows.append(
            {
                "country_iso3": country,
                "period": period_to_date(period).isoformat(),
                "source": "imf",
                "country_name": names[country],
                "tonnes": round(ounces / TROY_OUNCES_PER_TONNE, 3),
                "gold_value_usd": round(gold_market, 2) if gold_market is not None else None,
                "total_reserves_usd": round(total_market, 2) if total_market is not None else None,
                "pct_of_reserves": (
                    round(gold_market / total_market * 100, 3)
                    if gold_market is not None and total_market
                    else None
                ),
                "source_url": SOURCE_URL,
            }
        )
    return rows


def refresh(since_year: int) -> int:
    names = fetch_country_names()
    records = fetch_irfcl(since_year)
    rows = build_rows(records, names)
    # Countries report on different schedules, so show each one's latest month.
    latest_by_country: dict[str, dict] = {}
    for row in rows:
        current = latest_by_country.get(row["country_iso3"])
        if current is None or row["period"] > current["period"]:
            latest_by_country[row["country_iso3"]] = row
    print(f"  {len(records)} IMF records -> {len(rows)} country-months")
    for row in sorted(latest_by_country.values(), key=lambda r: -r["tonnes"])[:12]:
        print(
            f"  {row['country_name']:<26} {row['tonnes']:>9,.1f} t   "
            f"{row['pct_of_reserves']}% of reserves   ({row['period'][:7]})"
        )
    # Replace (not just upsert) the IMF rows for the reloaded period, so revised or
    # newly skipped months don't linger. Hand-entered rows (source = manual) are untouched.
    delete_rows(
        "central_bank_gold_reserves",
        {"source": "eq.imf", "period": f"gte.{since_year}-01-01"},
    )
    return upsert_in_batches(
        "central_bank_gold_reserves", rows, on_conflict="country_iso3,period,source"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="IMF official gold reserves into Supabase")
    parser.add_argument("--since", type=int, default=date.today().year - 3, help="first year to load")
    args = parser.parse_args()
    run_job(JOB, lambda: refresh(args.since))


if __name__ == "__main__":
    main()
