/**
 * =============================================================================
 * gold-physical.ts — database reads for /gold/physical (docs/10-gold-physical.md)
 * =============================================================================
 *
 * Two sections, both filtered by the market switch (USA or Canada):
 *   1. Metal ETFs, trusts, and receipts   vehicles (+ vehicle_daily for liquidity)
 *   2. Bullion dealers                     dealers
 *
 * Each function returns `null` if its query fails, so the page can show
 * "data unavailable" for that section and still render the rest.
 */

import { average, fetchAllPages, isoDaysAgo, rowsOf, safely } from "./query-helpers";

/** The two MVP markets. Drives which funds and dealers are listed. */
export type Market = "US" | "CA";

/** `?market=ca` -> "CA"; anything else (or nothing) -> the default, "US". */
export function parseMarket(value: string | string[] | undefined): Market {
  return typeof value === "string" && value.toLowerCase() === "ca" ? "CA" : "US";
}

/* ===========================================================================
 * 1. Metal ETFs, trusts, and receipts
 * ========================================================================= */

export type Vehicle = {
  symbol: string;
  ticker: string;
  name: string;
  issuer: string | null;
  /** 'etf' | 'trust' | 'receipt' — see VEHICLE_STRUCTURES in content/gold.ts. */
  structure: string;
  exchange: string;
  currency: string;
  /** Annual fee as a fraction: 0.004 = 0.40 %. */
  expenseRatio: number | null;
  vaultLocation: string | null;
  physicalRedemption: boolean;
  website: string | null;
  price: number | null;
  changePct: number | null;
  /** Total assets in the listing currency (Yahoo). */
  aum: number | null;
  /** Only set when we have a dated NAV from the issuer (none yet; see docs/10). */
  navPerShare: number | null;
  navAsOf: string | null;
  premiumDiscountPct: number | null;
  /** Average of (close × shares traded) over the last 30 sessions: a liquidity gauge. */
  avgDailyValue: number | null;
  priceAsOf: string | null;
};

const LIQUIDITY_SESSIONS = 30;

type VehicleRow = {
  symbol: string;
  ticker: string;
  name: string;
  issuer: string | null;
  structure: string;
  exchange: string;
  currency: string;
  expense_ratio: number | string | null;
  vault_location: string | null;
  physical_redemption: boolean;
  website: string | null;
  market_price: number | string | null;
  change_pct: number | string | null;
  aum: number | string | null;
  nav_per_share: number | string | null;
  nav_as_of: string | null;
  premium_discount_pct: number | string | null;
  price_as_of: string | null;
};

// One literal string: supabase-js reads it to type the rows, and `+` joins would defeat that.
const VEHICLE_COLUMNS =
  "symbol, ticker, name, issuer, structure, exchange, currency, expense_ratio, vault_location, physical_redemption, website, market_price, change_pct, aum, nav_per_share, nav_as_of, premium_discount_pct, price_as_of";

type DailyRow = { symbol: string; as_of_date: string; close_price: number | string; volume: number | null };

/** Postgres `numeric` can arrive as text; turn it into a number (or null). */
const num = (value: number | string | null | undefined) => (value == null ? null : Number(value));

export async function getVehicles(market: Market): Promise<Vehicle[] | null> {
  return safely("physical vehicles", async (supabase) => {
    // SELECT ... FROM vehicles WHERE commodity_slug = 'gold' AND is_active AND country = :market
    const rows = rowsOf<VehicleRow>(
      await supabase
        .from("vehicles")
        .select(VEHICLE_COLUMNS)
        .eq("commodity_slug", "gold")
        .eq("is_active", true)
        .eq("country", market)
        .order("aum", { ascending: false, nullsFirst: false }),
    );
    if (rows.length === 0) return [];

    // Last ~30 sessions of price and volume for these funds (≈ 45 calendar days).
    const history = await fetchAllPages<DailyRow>((from, to) =>
      supabase
        .from("vehicle_daily")
        .select("symbol, as_of_date, close_price, volume")
        .in(
          "symbol",
          rows.map((row) => row.symbol),
        )
        .gte("as_of_date", isoDaysAgo(50))
        .order("as_of_date", { ascending: false })
        .range(from, to),
    );

    return rows.map((row) => ({
      symbol: row.symbol,
      ticker: row.ticker,
      name: row.name,
      issuer: row.issuer,
      structure: row.structure,
      exchange: row.exchange,
      currency: row.currency,
      expenseRatio: num(row.expense_ratio),
      vaultLocation: row.vault_location,
      physicalRedemption: row.physical_redemption,
      website: row.website,
      price: num(row.market_price),
      changePct: num(row.change_pct),
      aum: num(row.aum),
      navPerShare: num(row.nav_per_share),
      navAsOf: row.nav_as_of,
      premiumDiscountPct: num(row.premium_discount_pct),
      avgDailyValue: averageDailyValue(history, row.symbol),
      priceAsOf: row.price_as_of,
    }));
  });
}

/** Average (close × volume) over the most recent sessions that have a volume. */
function averageDailyValue(history: DailyRow[], symbol: string): number | null {
  const values = history
    .filter((day) => day.symbol === symbol && day.volume != null)
    .slice(0, LIQUIDITY_SESSIONS) // history is newest first
    .map((day) => Number(day.close_price) * Number(day.volume));
  return average(values);
}

/* ===========================================================================
 * 2. Bullion dealers
 * ========================================================================= */

export type Dealer = {
  id: number;
  name: string;
  website: string;
  hqCity: string | null;
  sells: string | null;
  online: boolean;
  notes: string | null;
};

export async function getDealers(market: Market): Promise<Dealer[] | null> {
  return safely("dealers", async (supabase) => {
    // SELECT ... FROM dealers WHERE is_active AND country = :market ORDER BY name
    const rows = rowsOf<{
      id: number;
      name: string;
      website: string;
      hq_city: string | null;
      sells: string | null;
      online: boolean;
      notes: string | null;
    }>(
      await supabase
        .from("dealers")
        .select("id, name, website, hq_city, sells, online, notes")
        .eq("is_active", true)
        .eq("country", market)
        .order("name"),
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      website: row.website,
      hqCity: row.hq_city,
      sells: row.sells,
      online: row.online,
      notes: row.notes,
    }));
  });
}
