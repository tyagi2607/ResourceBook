/**
 * =============================================================================
 * gold-macro.ts — database reads for the "Why gold" data (docs/08)
 * =============================================================================
 *
 * Used by /gold (cards + driver strip) and /gold/why (full sections).
 * Each function returns `null` if its query fails, so one broken section
 * never takes the whole page down; the page shows "data unavailable" instead.
 *
 * TABLES (filled by the Python scripts in /scripts)
 *   commodity_daily            gold futures daily bars        etl_yahoo.py
 *   vehicle_daily              GLD daily volume               etl_yahoo.py
 *   macro_series/observations  FRED real & nominal yields     fetch_fred.py
 *   country_fiscal             IMF debt & deficit, % of GDP   fetch_imf_fiscal.py
 *   central_bank_gold_reserves IMF official gold holdings     fetch_imf_gold_reserves.py
 *   data_refresh_log           when each script last ran      every script
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Client = ReturnType<typeof createSupabaseServerClient>;

/** Run `work` with a client; log and return null on any failure. */
async function safely<T>(label: string, work: (supabase: Client) => Promise<T>): Promise<T | null> {
  try {
    return await work(createSupabaseServerClient());
  } catch (error) {
    console.error(`[gold-macro] ${label} failed:`, error);
    return null;
  }
}

/** Throw on a Supabase error so `safely` logs it; otherwise return the rows. */
function rowsOf<T>(result: { data: T[] | null; error: unknown }): T[] {
  if (result.error) throw result.error;
  return result.data ?? [];
}

/**
 * Supabase returns at most 1,000 rows per request. For long histories we ask for
 * rows 0–999, then 1000–1999, ... until a page comes back short.
 */
const PAGE_SIZE = 1000;
async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const rows = rowsOf(await page(from, from + PAGE_SIZE - 1));
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

/* ===========================================================================
 * 1. Market cards: gold futures last close + GLD volume signal
 * ========================================================================= */

export type FuturesCard = {
  close: number;
  changePct: number | null;
  asOfDate: string;
};

export type VolumeLevel = "above" | "normal" | "quiet";

export type VolumeCard = {
  /** 5-session average volume ÷ 252-session average volume. */
  ratio: number;
  level: VolumeLevel;
  recentAvg: number;
  yearAvg: number;
  asOfDate: string;
  /** Last 30 sessions, oldest first, for the mini bar chart. */
  recent: { date: string; volume: number }[];
};

export const VOLUME_WINDOW_RECENT = 5; // trading sessions ≈ 7 calendar days
export const VOLUME_WINDOW_YEAR = 252; // trading sessions ≈ 365 calendar days

export async function getFuturesCard(): Promise<FuturesCard | null> {
  return safely("futures card", async (supabase) => {
    // SELECT as_of_date, close_price FROM commodity_daily
    // WHERE commodity_slug = 'gold' ORDER BY as_of_date DESC LIMIT 2
    const rows = rowsOf(
      await supabase
        .from("commodity_daily")
        .select("as_of_date, close_price")
        .eq("commodity_slug", "gold")
        .order("as_of_date", { ascending: false })
        .limit(2),
    );
    if (rows.length === 0) return null;
    const [latest, previous] = rows;
    return {
      close: Number(latest.close_price),
      changePct: previous ? (Number(latest.close_price) / Number(previous.close_price) - 1) * 100 : null,
      asOfDate: latest.as_of_date,
    };
  });
}

export async function getVolumeCard(symbol = "GLD"): Promise<VolumeCard | null> {
  return safely("volume card", async (supabase) => {
    const rows = rowsOf(
      await supabase
        .from("vehicle_daily")
        .select("as_of_date, volume")
        .eq("symbol", symbol)
        .not("volume", "is", null)
        .gt("volume", 0)
        .order("as_of_date", { ascending: false })
        .limit(VOLUME_WINDOW_YEAR),
    );
    // Need close to a full year of history for a fair "normal" baseline.
    if (rows.length < VOLUME_WINDOW_YEAR * 0.9) return null;

    const volumes = rows.map((row) => Number(row.volume));
    const recentAvg = average(volumes.slice(0, VOLUME_WINDOW_RECENT))!;
    const yearAvg = average(volumes)!;
    const ratio = recentAvg / yearAvg;
    return {
      ratio,
      level: ratio >= 1.25 ? "above" : ratio < 0.8 ? "quiet" : "normal",
      recentAvg,
      yearAvg,
      asOfDate: rows[0].as_of_date,
      recent: rows
        .slice(0, 30)
        .reverse()
        .map((row) => ({ date: row.as_of_date, volume: Number(row.volume) })),
    };
  });
}

/* ===========================================================================
 * 2. Real rates (FRED)
 * ========================================================================= */

export type Observation = { date: string; value: number };

export type RealRatesSnapshot = {
  real: Observation;
  /** Nominal and breakeven on the same date as `real`, so the formula lines up. */
  nominal: Observation | null;
  breakeven: Observation | null;
  realMonthAgo: Observation | null;
  citations: { seriesId: string; citation: string; url: string }[];
};

async function latestObservation(
  supabase: Client,
  seriesId: string,
  onOrBefore?: string,
): Promise<Observation | null> {
  let query = supabase
    .from("macro_observations")
    .select("obs_date, value")
    .eq("series_id", seriesId)
    .order("obs_date", { ascending: false })
    .limit(1);
  if (onOrBefore) query = query.lte("obs_date", onOrBefore);
  const [row] = rowsOf(await query);
  return row ? { date: row.obs_date, value: Number(row.value) } : null;
}

export async function getRealRatesSnapshot(): Promise<RealRatesSnapshot | null> {
  return safely("real rates snapshot", async (supabase) => {
    const real = await latestObservation(supabase, "DFII10");
    if (!real) return null;
    const monthAgo = new Date(`${real.date}T12:00:00Z`);
    monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);

    const [nominal, breakeven, realMonthAgo, series] = await Promise.all([
      latestObservation(supabase, "DGS10", real.date),
      latestObservation(supabase, "T10YIE", real.date),
      latestObservation(supabase, "DFII10", monthAgo.toISOString().slice(0, 10)),
      supabase.from("macro_series").select("series_id, citation, source_url").in("series_id", ["DFII10", "DGS10", "T10YIE"]),
    ]);
    return {
      real,
      nominal,
      breakeven,
      realMonthAgo,
      citations: rowsOf(series).map((row) => ({
        seriesId: row.series_id,
        citation: row.citation,
        url: row.source_url,
      })),
    };
  });
}

export type GoldVsRealPoint = { date: string; gold: number | null; real: number | null };

/**
 * Weekly points since 2003: gold futures close and the 10-year real yield.
 * Daily data (~6,000 rows each) is thinned to one point per week (last value),
 * which looks identical on a 20-year chart and keeps the page light.
 */
export async function getGoldVsRealYield(): Promise<GoldVsRealPoint[] | null> {
  return safely("gold vs real yield", async (supabase) => {
    const since = "2003-01-01";
    const [gold, real] = await Promise.all([
      fetchAllPages((from, to) =>
        supabase
          .from("commodity_daily")
          .select("as_of_date, close_price")
          .eq("commodity_slug", "gold")
          .gte("as_of_date", since)
          .order("as_of_date")
          .range(from, to),
      ),
      fetchAllPages((from, to) =>
        supabase
          .from("macro_observations")
          .select("obs_date, value")
          .eq("series_id", "DFII10")
          .gte("obs_date", since)
          .order("obs_date")
          .range(from, to),
      ),
    ]);

    // Bucket by week number (days since 1970 ÷ 7); later rows overwrite earlier ones.
    const week = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / (7 * 86_400_000));
    const points = new Map<number, GoldVsRealPoint>();
    const pointFor = (date: string) => {
      const key = week(date);
      const point = points.get(key) ?? { date, gold: null, real: null };
      point.date = date > point.date ? date : point.date;
      points.set(key, point);
      return point;
    };
    for (const row of gold) pointFor(row.as_of_date).gold = Number(row.close_price);
    for (const row of real) pointFor(row.obs_date).real = Number(row.value);
    return [...points.entries()].sort(([a], [b]) => a - b).map(([, point]) => point);
  });
}

/* ===========================================================================
 * 3. Debt and deficits (IMF)
 * ========================================================================= */

export type FiscalRow = {
  iso3: string;
  name: string;
  gdpUsdBn: number | null;
  debtPct: number | null;
  balancePct: number | null;
  /** Debt % of GDP five years earlier, for the trend arrow. */
  debtPct5yAgo: number | null;
};

export type FiscalTable = {
  year: number;
  vintage: string;
  isProjection: boolean;
  rows: FiscalRow[];
};

export async function getFiscalTop10(year = new Date().getUTCFullYear()): Promise<FiscalTable | null> {
  return safely("fiscal top 10", async (supabase) => {
    // Top 10 economies by GDP (US dollars) for `year`.
    const top = rowsOf(
      await supabase
        .from("country_fiscal")
        .select("country_iso3, country_name, gdp_usd_bn, gross_debt_pct_gdp, fiscal_balance_pct_gdp, is_projection, vintage")
        .eq("year", year)
        .not("gdp_usd_bn", "is", null)
        .order("gdp_usd_bn", { ascending: false })
        .limit(10),
    );
    if (top.length === 0) return null;

    const earlier = rowsOf(
      await supabase
        .from("country_fiscal")
        .select("country_iso3, gross_debt_pct_gdp")
        .eq("year", year - 5)
        .in("country_iso3", top.map((row) => row.country_iso3)),
    );
    const debt5y = new Map(earlier.map((row) => [row.country_iso3, row.gross_debt_pct_gdp]));
    const num = (value: unknown) => (value == null ? null : Number(value));

    return {
      year,
      vintage: top[0].vintage,
      isProjection: top[0].is_projection,
      rows: top.map((row) => ({
        iso3: row.country_iso3,
        name: row.country_name,
        gdpUsdBn: num(row.gdp_usd_bn),
        debtPct: num(row.gross_debt_pct_gdp),
        balancePct: num(row.fiscal_balance_pct_gdp),
        debtPct5yAgo: num(debt5y.get(row.country_iso3)),
      })),
    };
  });
}

/* ===========================================================================
 * 4. Central bank gold reserves (IMF)
 * ========================================================================= */

export type ReserveHolder = {
  iso3: string;
  name: string;
  tonnes: number;
  pctOfReserves: number | null;
  /** Tonnes added (or sold, if negative) over the 12 months to `period`. */
  change12m: number | null;
  /** First day of the latest month this country reported. */
  period: string;
};

export type CentralBankData = {
  topHolders: ReserveHolder[];
  topBuyers: ReserveHolder[];
  byCountry: Record<string, ReserveHolder>;
  latestPeriod: string;
};

function monthsBefore(period: string, months: number): string {
  const date = new Date(`${period}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

export async function getCentralBankData(): Promise<CentralBankData | null> {
  return safely("central bank reserves", async (supabase) => {
    const rows = await fetchAllPages((from, to) =>
      supabase
        .from("central_bank_gold_reserves")
        .select("country_iso3, country_name, period, source, tonnes, pct_of_reserves")
        .gte("period", isoDaysAgo(560)) // ~18 months: latest month + the same month a year earlier
        .order("period")
        .order("country_iso3")
        .range(from, to),
    );
    if (rows.length === 0) return null;

    // country -> period -> row. IMF rows win over hand-entered ones for the same month.
    const byCountry = new Map<string, Map<string, (typeof rows)[number]>>();
    for (const row of rows) {
      const periods = byCountry.get(row.country_iso3) ?? new Map();
      const existing = periods.get(row.period);
      if (!existing || row.source === "imf") periods.set(row.period, row);
      byCountry.set(row.country_iso3, periods);
    }

    const latestPeriod = rows.reduce((max, row) => (row.period > max ? row.period : max), rows[0].period);
    // Skip countries whose latest report is more than 6 months behind the newest data.
    const staleBefore = monthsBefore(latestPeriod, 6);

    const holders: ReserveHolder[] = [];
    for (const [iso3, periods] of byCountry) {
      const latestKey = [...periods.keys()].sort().at(-1)!;
      if (latestKey < staleBefore) continue;
      const latest = periods.get(latestKey)!;
      const yearAgo = periods.get(monthsBefore(latestKey, 12));
      holders.push({
        iso3,
        name: latest.country_name,
        tonnes: Number(latest.tonnes),
        pctOfReserves: latest.pct_of_reserves == null ? null : Number(latest.pct_of_reserves),
        change12m: yearAgo ? Number(latest.tonnes) - Number(yearAgo.tonnes) : null,
        period: latestKey,
      });
    }

    return {
      topHolders: [...holders].sort((a, b) => b.tonnes - a.tonnes).slice(0, 10),
      topBuyers: holders
        .filter((holder) => (holder.change12m ?? 0) > 0.5)
        .sort((a, b) => b.change12m! - a.change12m!)
        .slice(0, 8),
      byCountry: Object.fromEntries(holders.map((holder) => [holder.iso3, holder])),
      latestPeriod,
    };
  });
}

/* ===========================================================================
 * 5. "Updated <date>" labels
 * ========================================================================= */

export type RefreshTimes = Partial<Record<string, string>>;

/** Latest successful run time per job, e.g. { fred: "2026-10-09T21:33:00Z", ... }. */
export async function getRefreshTimes(): Promise<RefreshTimes> {
  const result = await safely("refresh log", async (supabase) => {
    const rows = rowsOf(
      await supabase
        .from("data_refresh_log")
        .select("job, ran_at")
        .eq("status", "ok")
        .order("ran_at", { ascending: false })
        .limit(100),
    );
    const times: RefreshTimes = {};
    for (const row of rows) times[row.job] ??= row.ran_at;
    return times;
  });
  return result ?? {};
}
