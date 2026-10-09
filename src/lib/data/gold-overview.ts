/**
 * =============================================================================
 * gold-overview.ts — every database read the Gold Overview page needs
 * =============================================================================
 *
 * WHY A SEPARATE "DATA" FILE
 * --------------------------
 * Pages should describe layout; queries live here. Think of this file as the
 * set of SQL views the page selects from. Each Supabase call below maps to a
 * simple SQL statement (shown in the comments).
 *
 * FAILURE BEHAVIOR
 * ----------------
 * If Supabase is unreachable or a query fails, we log the error on the server
 * and return empty values plus `hadError: true`. The page still renders and
 * shows a small notice, instead of crashing.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** One company row in the "Top movers" leaderboards. */
export type CompanyMover = {
  symbol: string;
  ticker: string;
  name: string;
  tier: string;
  currency: string;
  market_price: number | null;
  change_pct: number | null;
};

/** One producer row in the "Lowest AISC" leaderboard. */
export type AiscLeader = {
  symbol: string;
  ticker: string;
  name: string;
  aisc_per_oz: number | null;
  fundamentals_as_of: string | null;
};

/**
 * Live gold/silver quotes are NOT here: they come from TradingView widgets so
 * they match the chart exactly (see components/charts/TradingViewQuotes.tsx).
 */
export type GoldOverviewData = {
  /** How many active rows feed each Gold page (used on the "Ways to own" cards). */
  counts: { vehicles: number; dealers: number; minerEtfs: number; companies: number };
  gainers: CompanyMover[];
  decliners: CompanyMover[];
  aiscLeaders: AiscLeader[];
  hadError: boolean;
};

const EMPTY_DATA: GoldOverviewData = {
  counts: { vehicles: 0, dealers: 0, minerEtfs: 0, companies: 0 },
  gainers: [],
  decliners: [],
  aiscLeaders: [],
  hadError: true,
};

const MOVER_COLUMNS = "symbol, ticker, name, tier, currency, market_price, change_pct";
const LEADERBOARD_SIZE = 5;

export async function getGoldOverviewData(): Promise<GoldOverviewData> {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    console.error("[gold-overview] Supabase not configured:", error);
    return EMPTY_DATA;
  }

  // Count helper: SELECT count(*) FROM <table> WHERE is_active [AND commodity_slug = 'gold']
  // `head: true` asks only for the count, not the rows themselves.
  const countActive = (table: string, goldOnly = true) => {
    const query = supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    return goldOnly ? query.eq("commodity_slug", "gold") : query;
  };

  // All queries run in parallel; the page waits for the slowest one.
  const [
    vehiclesCount,
    dealersCount,
    minerEtfsCount,
    companiesCount,
    gainersResult,
    declinersResult,
    aiscResult,
  ] = await Promise.all([
    countActive("vehicles"),
    countActive("dealers", false), // dealers aren't tied to one commodity
    countActive("miner_etfs"),
    countActive("companies"),

    // Top gainers: gold companies with a 1-day change, highest first.
    supabase
      .from("companies")
      .select(MOVER_COLUMNS)
      .eq("commodity_slug", "gold")
      .eq("is_active", true)
      .gt("change_pct", 0)
      .order("change_pct", { ascending: false })
      .limit(LEADERBOARD_SIZE),

    // Top decliners: same, lowest first.
    supabase
      .from("companies")
      .select(MOVER_COLUMNS)
      .eq("commodity_slug", "gold")
      .eq("is_active", true)
      .lt("change_pct", 0)
      .order("change_pct", { ascending: true })
      .limit(LEADERBOARD_SIZE),

    // Lowest-cost producers: AISC (all-in sustaining cost per ounce), cheapest first.
    supabase
      .from("companies")
      .select("symbol, ticker, name, aisc_per_oz, fundamentals_as_of")
      .eq("commodity_slug", "gold")
      .eq("tier", "producer")
      .eq("is_active", true)
      .not("aisc_per_oz", "is", null)
      .order("aisc_per_oz", { ascending: true })
      .limit(LEADERBOARD_SIZE),
  ]);

  const results = [
    vehiclesCount,
    dealersCount,
    minerEtfsCount,
    companiesCount,
    gainersResult,
    declinersResult,
    aiscResult,
  ];
  const errors = results.map((result) => result.error).filter(Boolean);
  if (errors.length > 0) {
    console.error("[gold-overview] Query errors:", errors);
  }

  return {
    counts: {
      vehicles: vehiclesCount.count ?? 0,
      dealers: dealersCount.count ?? 0,
      minerEtfs: minerEtfsCount.count ?? 0,
      companies: companiesCount.count ?? 0,
    },
    gainers: (gainersResult.data ?? []) as CompanyMover[],
    decliners: (declinersResult.data ?? []) as CompanyMover[],
    aiscLeaders: (aiscResult.data ?? []) as AiscLeader[],
    hadError: errors.length > 0,
  };
}
