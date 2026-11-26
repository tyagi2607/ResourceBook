"""
compute_company_nav.py — dual P/NAV at 3y avg gold and latest gold close.

Run after etl_yahoo.py (needs commodity_daily gold history + company market_cap):
    .venv\\Scripts\\python scripts\\compute_company_nav.py

For each active gold producer:
  - If mine rows have production + recoverable reserves → mine_dcf_v1
  - Else if company has production + AISC + reserves → company_proxy_v1
  - Else skip (no NAV)

Stores nav_* / pnav_* on companies and upserts company_nav_daily.
"""

from __future__ import annotations

from datetime import date, timedelta

from mine_dcf import DEFAULT_DISCOUNT_RATE, DEFAULT_TAX_RATE, company_proxy_mine, compute_company_nav
from supabase_rest import run_job, select_rows, update_row, upsert_rows

JOB = "company_nav_daily"
BASELINE_YEARS = 3


def _f(value) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def gold_prices() -> tuple[float, float, str]:
    """Return (close_usd, baseline_3y_avg_usd, as_of_date)."""
    rows = select_rows(
        "commodity_daily",
        {
            "select": "close_price,as_of_date",
            "commodity_slug": "eq.gold",
            "order": "as_of_date.desc",
            "limit": "1200",
        },
    )
    if not rows:
        raise RuntimeError("No gold rows in commodity_daily — run etl_yahoo first.")
    close = float(rows[0]["close_price"])
    as_of = rows[0]["as_of_date"]
    cutoff = date.fromisoformat(as_of) - timedelta(days=365 * BASELINE_YEARS)
    window = [float(r["close_price"]) for r in rows if date.fromisoformat(r["as_of_date"]) >= cutoff]
    if not window:
        window = [close]
    baseline = sum(window) / len(window)
    return close, baseline, as_of


def build_mines(company: dict, mine_rows: list[dict]) -> tuple[list[dict], str] | None:
    company_aisc = _f(company.get("aisc_per_oz"))
    deep: list[dict] = []
    for mine in mine_rows:
        prod_koz = _f(mine.get("production_koz"))
        rec_koz = _f(mine.get("recoverable_reserves_koz"))
        if prod_koz is None or prod_koz <= 0 or rec_koz is None or rec_koz <= 0:
            continue
        aisc = _f(mine.get("aisc_per_oz"))
        if aisc is None:
            aisc = company_aisc
        if aisc is None:
            continue
        ownership = _f(mine.get("ownership_pct")) or 100.0
        deep.append(
            {
                "annual_production_oz": prod_koz * 1000 * (ownership / 100.0),
                "recoverable_reserves_koz": rec_koz * (ownership / 100.0),
                "aisc_per_oz": aisc,
            }
        )
    if deep:
        return deep, "mine_dcf_v1"

    prod = _f(company.get("production_koz"))
    reserves = _f(company.get("reserves_moz"))
    if company_aisc is None or prod is None or prod <= 0 or reserves is None or reserves <= 0:
        return None
    return (
        [company_proxy_mine(production_koz=prod, reserves_moz=reserves, aisc_per_oz=company_aisc)],
        "company_proxy_v1",
    )


def work() -> int:
    close, baseline, as_of = gold_prices()
    print(f"Gold close ${close:,.2f} | 3y avg ${baseline:,.2f} | as_of {as_of}")

    companies = select_rows(
        "companies",
        {
            "select": (
                "symbol,tier,market_cap,market_price,shares_outstanding_m,"
                "production_koz,aisc_per_oz,reserves_moz,"
                "cash_musd,debt_musd,discount_rate,tax_rate"
            ),
            "commodity_slug": "eq.gold",
            "is_active": "eq.true",
            "tier": "eq.producer",
        },
    )
    all_mines = select_rows(
        "company_mines",
        {
            "select": (
                "company_symbol,production_koz,recoverable_reserves_koz,"
                "aisc_per_oz,ownership_pct,is_active"
            ),
            "is_active": "eq.true",
        },
    )
    mines_by_symbol: dict[str, list[dict]] = {}
    for mine in all_mines:
        mines_by_symbol.setdefault(mine["company_symbol"], []).append(mine)

    history_rows: list[dict] = []
    updated = 0
    skipped = 0

    for company in companies:
        symbol = company["symbol"]
        built = build_mines(company, mines_by_symbol.get(symbol, []))
        if built is None:
            skipped += 1
            continue
        mines, method = built

        discount = _f(company.get("discount_rate")) or DEFAULT_DISCOUNT_RATE
        tax = _f(company.get("tax_rate"))
        if tax is None:
            tax = DEFAULT_TAX_RATE
        cash = _f(company.get("cash_musd")) or 0.0
        debt = _f(company.get("debt_musd")) or 0.0
        market_cap = _f(company.get("market_cap"))
        # Yahoo fast_info.market_cap is often blank; fall back to price × shares,
        # then to a live Yahoo lookup so P/NAV still fills for peers.
        if market_cap is None:
            price = _f(company.get("market_price"))
            shares_m = _f(company.get("shares_outstanding_m"))
            if price is not None and shares_m is not None and shares_m > 0:
                market_cap = price * shares_m * 1e6
            else:
                try:
                    import yfinance as yf

                    info = yf.Ticker(symbol).fast_info
                    raw_cap = info.get("market_cap")
                    market_cap = float(raw_cap) if raw_cap not in (None, "") else None
                    if market_cap is None and price is not None:
                        raw_shares = info.get("shares")
                        shares = float(raw_shares) if raw_shares not in (None, "") else None
                        if shares:
                            market_cap = price * shares
                except Exception:
                    market_cap = None

        nav_close = compute_company_nav(
            mines,
            cash_musd=cash,
            debt_musd=debt,
            gold_price_usd=close,
            discount_rate=discount,
            tax_rate=tax,
        )["nav_musd"]
        nav_base = compute_company_nav(
            mines,
            cash_musd=cash,
            debt_musd=debt,
            gold_price_usd=baseline,
            discount_rate=discount,
            tax_rate=tax,
        )["nav_musd"]

        pnav_close = (market_cap / 1e6 / nav_close) if market_cap and nav_close > 0 else None
        pnav_base = (market_cap / 1e6 / nav_base) if market_cap and nav_base > 0 else None

        update_row(
            "companies",
            {"symbol": symbol},
            {
                "nav_baseline_musd": round(nav_base, 2),
                "nav_close_musd": round(nav_close, 2),
                "gold_baseline_usd": round(baseline, 2),
                "gold_close_usd": round(close, 2),
                "pnav_baseline": round(pnav_base, 4) if pnav_base is not None else None,
                "pnav_close": round(pnav_close, 4) if pnav_close is not None else None,
                "nav_computed_as_of": as_of,
                "nav_method": method,
            },
        )
        history_rows.append(
            {
                "symbol": symbol,
                "as_of_date": as_of,
                "gold_close_usd": round(close, 2),
                "gold_baseline_usd": round(baseline, 2),
                "nav_close_musd": round(nav_close, 2),
                "nav_baseline_musd": round(nav_base, 2),
                "pnav_close": round(pnav_close, 4) if pnav_close is not None else None,
                "pnav_baseline": round(pnav_base, 4) if pnav_base is not None else None,
                "nav_method": method,
                "source": method,
            }
        )
        updated += 1
        pnav_txt = f"{pnav_close:.2f}x" if pnav_close is not None else "n/a"
        print(f"  {symbol}: {method}  NAV_close=${nav_close:,.0f}M  P/NAV={pnav_txt}")

    if history_rows:
        upsert_rows("company_nav_daily", history_rows, on_conflict="symbol,as_of_date")

    print(f"Updated {updated} producers; skipped {skipped}.")
    return updated


if __name__ == "__main__":
    run_job(JOB, work)
