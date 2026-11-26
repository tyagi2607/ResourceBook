"""
mine_dcf.py — same simple mine NAV math as src/lib/valuation/mine-dcf.ts

Used by compute_company_nav.py after Yahoo ETL.
"""

from __future__ import annotations

DEFAULT_DISCOUNT_RATE = 0.05
DEFAULT_TAX_RATE = 0.30
MAX_LIFE_YEARS = 30


def npv_flat_cash_flow(annual_cf_musd: float, life_years: float, discount_rate: float) -> float:
    if annual_cf_musd == 0 or life_years <= 0:
        return 0.0
    life = min(life_years, MAX_LIFE_YEARS)
    full_years = int(life)
    fraction = life - full_years
    npv = 0.0
    for t in range(1, full_years + 1):
        npv += annual_cf_musd / ((1 + discount_rate) ** t)
    if fraction > 1e-9:
        npv += (annual_cf_musd * fraction) / ((1 + discount_rate) ** (full_years + 1))
    return npv


def mine_npv(
    *,
    annual_production_oz: float,
    recoverable_reserves_koz: float,
    aisc_per_oz: float,
    gold_price_usd: float,
    discount_rate: float,
    tax_rate: float,
) -> dict[str, float]:
    margin = gold_price_usd - aisc_per_oz
    annual_cf_pre = (margin * annual_production_oz) / 1e6
    annual_cf = annual_cf_pre * (1 - tax_rate)
    life_years = (
        (recoverable_reserves_koz * 1000) / annual_production_oz if annual_production_oz > 0 else 0.0
    )
    return {
        "annual_cf_musd": annual_cf,
        "life_years": life_years,
        "npv_musd": npv_flat_cash_flow(annual_cf, life_years, discount_rate),
    }


def compute_company_nav(
    mines: list[dict[str, float]],
    *,
    cash_musd: float,
    debt_musd: float,
    gold_price_usd: float,
    discount_rate: float = DEFAULT_DISCOUNT_RATE,
    tax_rate: float = DEFAULT_TAX_RATE,
) -> dict[str, float]:
    mine_npvs = [
        mine_npv(
            annual_production_oz=m["annual_production_oz"],
            recoverable_reserves_koz=m["recoverable_reserves_koz"],
            aisc_per_oz=m["aisc_per_oz"],
            gold_price_usd=gold_price_usd,
            discount_rate=discount_rate,
            tax_rate=tax_rate,
        )
        for m in mines
    ]
    ops = sum(row["npv_musd"] for row in mine_npvs)
    return {
        "ops_npv_musd": ops,
        "nav_musd": ops + cash_musd - debt_musd,
    }


def company_proxy_mine(
    *,
    production_koz: float,
    reserves_moz: float,
    aisc_per_oz: float,
) -> dict[str, float]:
    return {
        "annual_production_oz": production_koz * 1000,
        "recoverable_reserves_koz": reserves_moz * 1000,
        "aisc_per_oz": aisc_per_oz,
    }
