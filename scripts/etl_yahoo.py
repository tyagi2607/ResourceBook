"""
etl_yahoo.py — daily market data from Yahoo Finance into Supabase (PLAN.md build step 8).

For every instrument in the database it:
    1. appends daily history rows   (commodity_daily, vehicle_daily, miner_etf_daily, company_daily)
    2. updates the "current" row    (latest price, 1-day % change, as-of time)

Run from the repo root:
    .venv\\Scripts\\python scripts\\etl_yahoo.py              # last ~6 weeks (daily job)
    .venv\\Scripts\\python scripts\\etl_yahoo.py --backfill   # history: gold since 2003, others 2 years

WHAT USES IT
    - Gold futures card: commodity_daily for gold = Yahoo GC=F (front-month COMEX futures)
    - Volume signal:     vehicle_daily.volume for GLD (needs ~1 year of history -> backfill once)
    - Real-rates chart:  gold closes since 2003
    - Leaderboards:      companies.change_pct

WHICH INSTRUMENTS
    Read from Supabase, not hard-coded: commodities.spot_symbol plus every active row in
    vehicles, miner_etfs, and companies. Add a row to a seed CSV -> it gets prices tomorrow.

LICENSE NOTE
    yfinance is an unofficial library and Yahoo's terms limit redistribution. Fine for the
    MVP; replace this adapter with a licensed feed before any commercial launch
    (the tables stay the same).

Safe to re-run: history rows are upserted on (instrument, as_of_date).
"""

from __future__ import annotations

import argparse
import math
from datetime import date, datetime, timedelta, timezone

import yfinance as yf

from supabase_rest import run_job, select_rows, update_row, upsert_in_batches

JOB = "yahoo_daily"
DAILY_LOOKBACK_DAYS = 45      # re-fetch a few weeks so missed days self-heal
COMMODITY_MIN_DAYS = 400      # commodities always get >1 year (for the 52-week range)
GOLD_BACKFILL_START = date(2003, 1, 1)  # DFII10 starts in 2003
OTHER_BACKFILL_YEARS = 2


def clean(value) -> float | None:
    """Yahoo returns NaN for missing values; the database wants NULL."""
    if value is None:
        return None
    number = float(value)
    return None if math.isnan(number) else number


def download(symbols: list[str], start: date):
    """One Yahoo request for many symbols. Returns {symbol: DataFrame of daily bars}."""
    if not symbols:
        return {}
    data = yf.download(
        symbols,
        start=start.isoformat(),
        interval="1d",
        auto_adjust=False,  # raw closes (what the exchange printed), not dividend-adjusted
        actions=False,
        group_by="ticker",
        progress=False,
        threads=True,
    )
    frames = {}
    for symbol in symbols:
        try:
            frame = data[symbol] if symbol in data.columns.get_level_values(0) else None
        except (KeyError, AttributeError):
            frame = None
        if frame is None or frame.dropna(subset=["Close"]).empty:
            print(f"  (warning) no Yahoo data for {symbol} — check the symbol in the seed CSV")
            continue
        frames[symbol] = frame.dropna(subset=["Close"])
    return frames


def bars(frame) -> list[dict]:
    """DataFrame -> list of {as_of_date, open, high, low, close, volume}."""
    result = []
    for timestamp, row in frame.iterrows():
        volume = clean(row.get("Volume"))
        result.append(
            {
                "as_of_date": timestamp.date().isoformat(),
                "open": clean(row.get("Open")),
                "high": clean(row.get("High")),
                "low": clean(row.get("Low")),
                "close": round(clean(row["Close"]), 4),
                "volume": int(volume) if volume is not None else None,
            }
        )
    return result


def one_day_change(history: list[dict]) -> float | None:
    if len(history) < 2 or not history[-2]["close"]:
        return None
    return round((history[-1]["close"] / history[-2]["close"] - 1) * 100, 4)


def refresh_commodities(backfill: bool, now: str) -> int:
    rows = select_rows("commodities", {"select": "slug,spot_symbol", "spot_symbol": "not.is.null"})
    by_symbol = {row["spot_symbol"]: row["slug"] for row in rows}
    default_start = date.today() - timedelta(days=COMMODITY_MIN_DAYS)

    written = 0
    for symbol, slug in by_symbol.items():
        start = GOLD_BACKFILL_START if (backfill and slug == "gold") else default_start
        frame = download([symbol], start).get(symbol)
        if frame is None:
            continue
        history = bars(frame)
        written += upsert_in_batches(
            "commodity_daily",
            [
                {
                    "commodity_slug": slug,
                    "as_of_date": bar["as_of_date"],
                    "open_price": bar["open"],
                    "high_price": bar["high"],
                    "low_price": bar["low"],
                    "close_price": bar["close"],
                    "volume": bar["volume"],
                    "source": "yahoo",
                }
                for bar in history
            ],
            on_conflict="commodity_slug,as_of_date",
        )
        last_year = history[-252:]
        highs = [bar["high"] for bar in last_year if bar["high"] is not None]
        lows = [bar["low"] for bar in last_year if bar["low"] is not None]
        update_row(
            "commodities",
            {"slug": slug},
            {
                "price": history[-1]["close"],
                "change_pct": one_day_change(history),
                "high_52w": max(highs) if highs else None,
                "low_52w": min(lows) if lows else None,
                "price_as_of": now,
            },
        )
        print(f"  commodity {slug:<15} {symbol:<6} {len(history):>5} days   last {history[-1]['close']}")
    return written


def refresh_instruments(
    table: str, history_table: str, backfill: bool, now: str, with_market_cap: bool = False
) -> int:
    symbols = [row["symbol"] for row in select_rows(table, {"select": "symbol", "is_active": "eq.true"})]
    start = (
        date.today() - timedelta(days=365 * OTHER_BACKFILL_YEARS)
        if backfill
        else date.today() - timedelta(days=DAILY_LOOKBACK_DAYS)
    )
    frames = download(symbols, start)

    history_rows = []
    for symbol, frame in frames.items():
        history = bars(frame)
        history_rows += [
            {
                "symbol": symbol,
                "as_of_date": bar["as_of_date"],
                "close_price": bar["close"],
                "volume": bar["volume"],
                "source": "yahoo",
            }
            for bar in history
        ]
        current = {
            "market_price": history[-1]["close"],
            "change_pct": one_day_change(history),
            "price_as_of": now,
        }
        if with_market_cap:
            try:
                market_cap = clean(yf.Ticker(symbol).fast_info.get("market_cap"))
            except Exception:  # Yahoo sometimes lacks this field
                market_cap = None
            if market_cap:
                current["market_cap"] = round(market_cap, 2)
        update_row(table, {"symbol": symbol}, current)

    written = upsert_in_batches(history_table, history_rows, on_conflict="symbol,as_of_date")
    print(f"  {table:<11} {len(frames):>3}/{len(symbols)} symbols   {written:>6} history rows")
    return written


def refresh(backfill: bool) -> int:
    now = datetime.now(timezone.utc).isoformat()
    return (
        refresh_commodities(backfill, now)
        + refresh_instruments("vehicles", "vehicle_daily", backfill, now)
        + refresh_instruments("miner_etfs", "miner_etf_daily", backfill, now)
        + refresh_instruments("companies", "company_daily", backfill, now, with_market_cap=True)
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Yahoo daily prices into Supabase")
    parser.add_argument("--backfill", action="store_true", help="load longer history (run once)")
    args = parser.parse_args()
    run_job(JOB, lambda: refresh(args.backfill))


if __name__ == "__main__":
    main()
