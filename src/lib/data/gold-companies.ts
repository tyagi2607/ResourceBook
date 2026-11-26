/**
 * =============================================================================
 * gold-companies.ts — database reads for /gold/companies (docs/11-gold-companies.md)
 * =============================================================================
 *
 * Screener: equities by Lassonde tier + miner ETFs tab.
 * Detail: one company with mines, people, sources; reported-vs-spot margins.
 *
 * Each function returns `null` on failure so the page can degrade by section.
 */

import {
  companyProxyMine,
  computeCompanyNav,
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_TAX_RATE,
  mineNpvAtGold,
  type MineDcfInput,
} from "@/lib/valuation/mine-dcf";
import { rowsOf, safely } from "./query-helpers";

/* ===========================================================================
 * URL helpers
 * ========================================================================= */

export type CompanyTier = "royalty" | "producer" | "developer" | "explorer";
export type ScreenerTab = "all" | CompanyTier | "miner_etf";
export type DetailTab = "overview" | "valuation" | "management" | "mines" | "sources";

const SCREENER_TABS = new Set<string>(["all", "royalty", "producer", "developer", "explorer", "miner_etf"]);
const DETAIL_TABS = new Set<string>(["overview", "valuation", "management", "mines", "sources"]);

/** `?tier=producer` -> producer; unknown / missing -> "all". */
export function parseTier(value: string | string[] | undefined): ScreenerTab {
  if (typeof value !== "string") return "all";
  const key = value.toLowerCase();
  return SCREENER_TABS.has(key) ? (key as ScreenerTab) : "all";
}

/** `?tab=mines` -> mines; unknown / missing -> "overview". */
export function parseDetailTab(value: string | string[] | undefined): DetailTab {
  if (typeof value !== "string") return "overview";
  const key = value.toLowerCase();
  return DETAIL_TABS.has(key) ? (key as DetailTab) : "overview";
}

/* ===========================================================================
 * Shared helpers
 * ========================================================================= */

const num = (value: number | string | null | undefined) => (value == null ? null : Number(value));

/** Latest gold futures close (USD/oz) for spot margins. */
export async function getGoldSpotUsd(): Promise<{ price: number; asOf: string } | null> {
  return safely("gold spot", async (supabase) => {
    const rows = rowsOf<{ close_price: number | string; as_of_date: string }>(
      await supabase
        .from("commodity_daily")
        .select("close_price, as_of_date")
        .eq("commodity_slug", "gold")
        .order("as_of_date", { ascending: false })
        .limit(1),
    );
    const row = rows[0];
    if (!row) return null;
    return { price: Number(row.close_price), asOf: row.as_of_date };
  });
}

export function aiscMargin(goldPrice: number | null, aisc: number | null): number | null {
  if (goldPrice == null || aisc == null) return null;
  return goldPrice - aisc;
}

/** P&P Moz ÷ annual production Moz → years. production_koz is thousands of oz. */
export function reserveLifeYears(reservesMoz: number | null, productionKoz: number | null): number | null {
  if (reservesMoz == null || productionKoz == null || productionKoz <= 0) return null;
  return reservesMoz / (productionKoz / 1000);
}

export function priceToNav(marketCap: number | null, navMusd: number | null): number | null {
  if (marketCap == null || navMusd == null || navMusd <= 0) return null;
  // market_cap is in listing currency units; nav_musd is millions USD.
  // For US-listed names, market_cap / 1e6 ≈ enterprise of equity in $M.
  return marketCap / 1e6 / navMusd;
}

/* ===========================================================================
 * Screener: companies
 * ========================================================================= */

export type CompanyRow = {
  symbol: string;
  ticker: string;
  name: string;
  tier: CompanyTier;
  exchange: string;
  country: string;
  currency: string;
  jurisdictionRisk: string | null;
  studyStage: string | null;
  website: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  productionKoz: number | null;
  aiscPerOz: number | null;
  aiscGoldPriceUsd: number | null;
  reservesMoz: number | null;
  cashMusd: number | null;
  debtMusd: number | null;
  navMusd: number | null;
  navGoldPriceUsd: number | null;
  navAsOf: string | null;
  fundamentalsAsOf: string | null;
  fundamentalsSource: string | null;
  sharesOutstandingM: number | null;
  discountRate: number | null;
  taxRate: number | null;
  navBaselineMusd: number | null;
  navCloseMusd: number | null;
  goldBaselineUsd: number | null;
  goldCloseUsd: number | null;
  pnavBaseline: number | null;
  pnavClose: number | null;
  navComputedAsOf: string | null;
  navMethod: string | null;
  /** Spot gold − AISC (filled when the page has spot). */
  spotMargin: number | null;
  /** Assumption gold − AISC. */
  assumptionMargin: number | null;
  reserveLife: number | null;
  /** Legacy filing NAV P/NAV when present. */
  priceToNav: number | null;
  primaryAsset: string | null;
  npv5PctMusd: number | null;
  irrPct: number | null;
  initialCapexMusd: number | null;
  cashRunwayMonths: number | null;
  latestAssay: string | null;
};

// One literal string so supabase-js can type the rows (string `+` joins break that).
const COMPANY_COLUMNS =
  "symbol, ticker, name, tier, exchange, country, currency, jurisdiction_risk, study_stage, website, primary_asset, market_price, change_pct, market_cap, production_koz, aisc_per_oz, aisc_gold_price_usd, reserves_moz, cash_musd, debt_musd, nav_musd, nav_gold_price_usd, nav_as_of, fundamentals_as_of, fundamentals_source, shares_outstanding_m, discount_rate, tax_rate, nav_baseline_musd, nav_close_musd, gold_baseline_usd, gold_close_usd, pnav_baseline, pnav_close, nav_computed_as_of, nav_method, npv_5pct_musd, irr_pct, initial_capex_musd, cash_runway_months, latest_assay";

type CompanyDb = {
  symbol: string;
  ticker: string;
  name: string;
  tier: CompanyTier;
  exchange: string;
  country: string;
  currency: string;
  jurisdiction_risk: string | null;
  study_stage: string | null;
  website: string | null;
  primary_asset: string | null;
  market_price: number | string | null;
  change_pct: number | string | null;
  market_cap: number | string | null;
  production_koz: number | string | null;
  aisc_per_oz: number | string | null;
  aisc_gold_price_usd: number | string | null;
  reserves_moz: number | string | null;
  cash_musd: number | string | null;
  debt_musd: number | string | null;
  nav_musd: number | string | null;
  nav_gold_price_usd: number | string | null;
  nav_as_of: string | null;
  fundamentals_as_of: string | null;
  fundamentals_source: string | null;
  shares_outstanding_m: number | string | null;
  discount_rate: number | string | null;
  tax_rate: number | string | null;
  nav_baseline_musd: number | string | null;
  nav_close_musd: number | string | null;
  gold_baseline_usd: number | string | null;
  gold_close_usd: number | string | null;
  pnav_baseline: number | string | null;
  pnav_close: number | string | null;
  nav_computed_as_of: string | null;
  nav_method: string | null;
  npv_5pct_musd: number | string | null;
  irr_pct: number | string | null;
  initial_capex_musd: number | string | null;
  cash_runway_months: number | string | null;
  latest_assay: string | null;
};

function mapCompany(row: CompanyDb, spot: number | null): CompanyRow {
  const aisc = num(row.aisc_per_oz);
  const assumption = num(row.aisc_gold_price_usd);
  const reserves = num(row.reserves_moz);
  const production = num(row.production_koz);
  const marketCap = num(row.market_cap);
  const nav = num(row.nav_musd);
  const navClose = num(row.nav_close_musd);
  const pnavClose = num(row.pnav_close);
  return {
    symbol: row.symbol,
    ticker: row.ticker,
    name: row.name,
    tier: row.tier,
    exchange: row.exchange,
    country: row.country,
    currency: row.currency,
    jurisdictionRisk: row.jurisdiction_risk,
    studyStage: row.study_stage,
    website: row.website,
    price: num(row.market_price),
    changePct: num(row.change_pct),
    marketCap,
    productionKoz: production,
    aiscPerOz: aisc,
    aiscGoldPriceUsd: assumption,
    reservesMoz: reserves,
    cashMusd: num(row.cash_musd),
    debtMusd: num(row.debt_musd),
    navMusd: nav,
    navGoldPriceUsd: num(row.nav_gold_price_usd),
    navAsOf: row.nav_as_of,
    fundamentalsAsOf: row.fundamentals_as_of,
    fundamentalsSource: row.fundamentals_source,
    sharesOutstandingM: num(row.shares_outstanding_m),
    discountRate: num(row.discount_rate),
    taxRate: num(row.tax_rate),
    navBaselineMusd: num(row.nav_baseline_musd),
    navCloseMusd: navClose,
    goldBaselineUsd: num(row.gold_baseline_usd),
    goldCloseUsd: num(row.gold_close_usd),
    pnavBaseline: num(row.pnav_baseline),
    pnavClose,
    navComputedAsOf: row.nav_computed_as_of,
    navMethod: row.nav_method,
    spotMargin: aiscMargin(spot, aisc),
    assumptionMargin: aiscMargin(assumption, aisc),
    reserveLife: reserveLifeYears(reserves, production),
    priceToNav: pnavClose ?? priceToNav(marketCap, navClose ?? nav),
    primaryAsset: row.primary_asset,
    npv5PctMusd: num(row.npv_5pct_musd),
    irrPct: num(row.irr_pct),
    initialCapexMusd: num(row.initial_capex_musd),
    cashRunwayMonths: num(row.cash_runway_months),
    latestAssay: row.latest_assay,
  };
}

/** TradingView symbol for equity charts, e.g. NYSE:AEM. */
export function tradingViewEquitySymbol(exchange: string, ticker: string): string {
  const map: Record<string, string> = {
    NYSE: "NYSE",
    NASDAQ: "NASDAQ",
    "NYSE American": "AMEX",
    TSX: "TSX",
    TSXV: "TSXV",
  };
  const prefix = map[exchange] ?? exchange;
  return `${prefix}:${ticker}`;
}

/** Companies for the screener. `tier` null means all equity tiers (not miner ETFs). */
export async function getCompanies(
  tier: CompanyTier | null,
  spotUsd: number | null,
): Promise<CompanyRow[] | null> {
  return safely("companies screener", async (supabase) => {
    let query = supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("commodity_slug", "gold")
      .eq("is_active", true)
      .order("market_cap", { ascending: false, nullsFirst: false });
    if (tier) query = query.eq("tier", tier);
    const rows = rowsOf<CompanyDb>(await query);
    return rows.map((row) => mapCompany(row, spotUsd));
  });
}

/* ===========================================================================
 * Screener: miner ETFs
 * ========================================================================= */

export type MinerEtfRow = {
  symbol: string;
  ticker: string;
  name: string;
  issuer: string | null;
  focus: string;
  exchange: string;
  country: string;
  currency: string;
  expenseRatio: number | null;
  holdingsSummary: string | null;
  website: string | null;
  price: number | null;
  changePct: number | null;
  aum: number | null;
};

export async function getMinerEtfs(): Promise<MinerEtfRow[] | null> {
  return safely("miner etfs screener", async (supabase) => {
    const rows = rowsOf<{
      symbol: string;
      ticker: string;
      name: string;
      issuer: string | null;
      focus: string;
      exchange: string;
      country: string;
      currency: string;
      expense_ratio: number | string | null;
      holdings_summary: string | null;
      website: string | null;
      market_price: number | string | null;
      change_pct: number | string | null;
      aum: number | string | null;
    }>(
      await supabase
        .from("miner_etfs")
        .select(
          "symbol, ticker, name, issuer, focus, exchange, country, currency, expense_ratio, holdings_summary, website, market_price, change_pct, aum",
        )
        .eq("commodity_slug", "gold")
        .eq("is_active", true)
        .order("aum", { ascending: false, nullsFirst: false }),
    );
    return rows.map((row) => ({
      symbol: row.symbol,
      ticker: row.ticker,
      name: row.name,
      issuer: row.issuer,
      focus: row.focus,
      exchange: row.exchange,
      country: row.country,
      currency: row.currency,
      expenseRatio: num(row.expense_ratio),
      holdingsSummary: row.holdings_summary,
      website: row.website,
      price: num(row.market_price),
      changePct: num(row.change_pct),
      aum: num(row.aum),
    }));
  });
}

/* ===========================================================================
 * Detail: one company + mines + people + sources
 * ========================================================================= */

export type MineRow = {
  mineSlug: string;
  name: string;
  country: string | null;
  region: string | null;
  status: string;
  ownershipPct: number;
  productionKoz: number | null;
  aiscPerOz: number | null;
  /** Resolved AISC used in DCF (mine or company fallback). */
  effectiveAiscPerOz: number | null;
  aiscIsCompanyFallback: boolean;
  aiscGoldPriceUsd: number | null;
  reservesPpMoz: number | null;
  recoverableReservesKoz: number | null;
  resourcesMiMoz: number | null;
  asOf: string | null;
  sourceUrl: string | null;
  notes: string | null;
  /** production × ownership/100 */
  attributableProductionKoz: number | null;
  attributableReservesMoz: number | null;
  spotMargin: number | null;
  assumptionMargin: number | null;
  npvBaselineMusd: number | null;
  npvCloseMusd: number | null;
};

export type PersonRow = {
  role: string;
  name: string;
  sinceYear: number | null;
  notes: string | null;
};

export type SourceRow = {
  kind: string;
  title: string;
  url: string;
  asOf: string | null;
};

export type MineRollup = {
  attributableProductionKoz: number | null;
  attributableReservesMoz: number | null;
  /** Production-weighted AISC across mines that have both production and AISC. */
  weightedAisc: number | null;
};

export type CompanyDetail = {
  company: CompanyRow;
  mines: MineRow[];
  people: PersonRow[];
  sources: SourceRow[];
  rollup: MineRollup;
  spot: { price: number; asOf: string } | null;
  valuation: {
    opsNpvBaselineMusd: number | null;
    opsNpvCloseMusd: number | null;
  };
};

function attributable(value: number | null, ownershipPct: number): number | null {
  if (value == null) return null;
  return value * (ownershipPct / 100);
}

function mineRollup(mines: MineRow[]): MineRollup {
  let prodSum = 0;
  let prodCount = 0;
  let resSum = 0;
  let resCount = 0;
  let weightedCost = 0;
  let weight = 0;
  for (const mine of mines) {
    if (mine.attributableProductionKoz != null) {
      prodSum += mine.attributableProductionKoz;
      prodCount += 1;
    }
    if (mine.attributableReservesMoz != null) {
      resSum += mine.attributableReservesMoz;
      resCount += 1;
    }
    if (mine.aiscPerOz != null && mine.attributableProductionKoz != null) {
      weightedCost += mine.aiscPerOz * mine.attributableProductionKoz;
      weight += mine.attributableProductionKoz;
    }
  }
  return {
    attributableProductionKoz: prodCount ? prodSum : null,
    attributableReservesMoz: resCount ? resSum : null,
    weightedAisc: weight > 0 ? weightedCost / weight : null,
  };
}

/** Resolve by Yahoo/seed symbol (e.g. AEM or SGD.TO). */
export async function getCompanyDetail(symbol: string): Promise<CompanyDetail | null> {
  return safely("company detail", async (supabase) => {
    const spot = await getGoldSpotUsd();
    const spotPrice = spot?.price ?? null;

    const companyRows = rowsOf<CompanyDb>(
      await supabase.from("companies").select(COMPANY_COLUMNS).eq("symbol", symbol).eq("is_active", true).limit(1),
    );
    const companyRow = companyRows[0];
    if (!companyRow) return null;

    const mineRows = rowsOf<{
      mine_slug: string;
      name: string;
      country: string | null;
      region: string | null;
      status: string;
      ownership_pct: number | string;
      production_koz: number | string | null;
      aisc_per_oz: number | string | null;
      aisc_gold_price_usd: number | string | null;
      reserves_pp_moz: number | string | null;
      recoverable_reserves_koz: number | string | null;
      resources_mi_moz: number | string | null;
      as_of: string | null;
      source_url: string | null;
      notes: string | null;
    }>(
      await supabase
        .from("company_mines")
        .select(
          "mine_slug, name, country, region, status, ownership_pct, production_koz, aisc_per_oz, aisc_gold_price_usd, reserves_pp_moz, recoverable_reserves_koz, resources_mi_moz, as_of, source_url, notes",
        )
        .eq("company_symbol", symbol)
        .eq("is_active", true)
        .order("sort_order"),
    );

    const peopleRows = rowsOf<{
      role: string;
      name: string;
      since_year: number | null;
      notes: string | null;
    }>(
      await supabase
        .from("company_people")
        .select("role, name, since_year, notes")
        .eq("company_symbol", symbol)
        .order("sort_order"),
    );

    const sourceRows = rowsOf<{
      kind: string;
      title: string;
      url: string;
      as_of: string | null;
    }>(
      await supabase
        .from("company_sources")
        .select("kind, title, url, as_of")
        .eq("company_symbol", symbol)
        .order("sort_order"),
    );

    const company = mapCompany(companyRow, spotPrice);
    const companyAisc = company.aiscPerOz;
    const discount = company.discountRate ?? DEFAULT_DISCOUNT_RATE;
    const tax = company.taxRate ?? DEFAULT_TAX_RATE;
    const goldBaseline = company.goldBaselineUsd;
    const goldClose = company.goldCloseUsd ?? spotPrice;

    const dcfMines: MineDcfInput[] = [];
    const mines: MineRow[] = mineRows.map((row) => {
      const ownership = Number(row.ownership_pct);
      const production = num(row.production_koz);
      const mineAisc = num(row.aisc_per_oz);
      const aiscIsCompanyFallback = mineAisc == null && companyAisc != null;
      const effectiveAisc = mineAisc ?? companyAisc;
      const assumption = num(row.aisc_gold_price_usd);
      const reserves = num(row.reserves_pp_moz);
      const recoverable = num(row.recoverable_reserves_koz);
      let npvBaseline: number | null = null;
      let npvClose: number | null = null;
      if (
        production != null &&
        production > 0 &&
        recoverable != null &&
        recoverable > 0 &&
        effectiveAisc != null
      ) {
        const input: MineDcfInput = {
          annualProductionOz: production * 1000 * (ownership / 100),
          recoverableReservesKoz: recoverable * (ownership / 100),
          aiscPerOz: effectiveAisc,
        };
        dcfMines.push(input);
        if (goldBaseline != null) {
          npvBaseline = mineNpvAtGold(input, goldBaseline, discount, tax).npvMusd;
        }
        if (goldClose != null) {
          npvClose = mineNpvAtGold(input, goldClose, discount, tax).npvMusd;
        }
      }
      return {
        mineSlug: row.mine_slug,
        name: row.name,
        country: row.country,
        region: row.region,
        status: row.status,
        ownershipPct: ownership,
        productionKoz: production,
        aiscPerOz: mineAisc,
        effectiveAiscPerOz: effectiveAisc,
        aiscIsCompanyFallback,
        aiscGoldPriceUsd: assumption,
        reservesPpMoz: reserves,
        recoverableReservesKoz: recoverable,
        resourcesMiMoz: num(row.resources_mi_moz),
        asOf: row.as_of,
        sourceUrl: row.source_url,
        notes: row.notes,
        attributableProductionKoz: attributable(production, ownership),
        attributableReservesMoz: attributable(reserves, ownership),
        spotMargin: aiscMargin(spotPrice, effectiveAisc),
        assumptionMargin: aiscMargin(assumption, effectiveAisc),
        npvBaselineMusd: npvBaseline,
        npvCloseMusd: npvClose,
      };
    });

    let opsNpvBaseline: number | null = company.navBaselineMusd != null && company.cashMusd != null && company.debtMusd != null
      ? company.navBaselineMusd - company.cashMusd + company.debtMusd
      : null;
    let opsNpvClose: number | null = company.navCloseMusd != null && company.cashMusd != null && company.debtMusd != null
      ? company.navCloseMusd - company.cashMusd + company.debtMusd
      : null;

    if (dcfMines.length === 0 && company.tier === "producer") {
      if (
        company.productionKoz != null &&
        company.reservesMoz != null &&
        company.aiscPerOz != null &&
        goldBaseline != null &&
        goldClose != null
      ) {
        const proxy = [
          companyProxyMine({
            productionKoz: company.productionKoz,
            reservesMoz: company.reservesMoz,
            aiscPerOz: company.aiscPerOz,
          }),
        ];
        opsNpvBaseline = computeCompanyNav({
          mines: proxy,
          cashMusd: 0,
          debtMusd: 0,
          goldPriceUsd: goldBaseline,
          discountRate: discount,
          taxRate: tax,
        }).opsNpvMusd;
        opsNpvClose = computeCompanyNav({
          mines: proxy,
          cashMusd: 0,
          debtMusd: 0,
          goldPriceUsd: goldClose,
          discountRate: discount,
          taxRate: tax,
        }).opsNpvMusd;
      }
    } else if (dcfMines.length > 0) {
      opsNpvBaseline =
        goldBaseline != null
          ? computeCompanyNav({
              mines: dcfMines,
              cashMusd: 0,
              debtMusd: 0,
              goldPriceUsd: goldBaseline,
              discountRate: discount,
              taxRate: tax,
            }).opsNpvMusd
          : opsNpvBaseline;
      opsNpvClose =
        goldClose != null
          ? computeCompanyNav({
              mines: dcfMines,
              cashMusd: 0,
              debtMusd: 0,
              goldPriceUsd: goldClose,
              discountRate: discount,
              taxRate: tax,
            }).opsNpvMusd
          : opsNpvClose;
    }

    return {
      company,
      mines,
      people: peopleRows.map((row) => ({
        role: row.role,
        name: row.name,
        sinceYear: row.since_year,
        notes: row.notes,
      })),
      sources: sourceRows.map((row) => ({
        kind: row.kind,
        title: row.title,
        url: row.url,
        asOf: row.as_of,
      })),
      rollup: mineRollup(mines),
      spot,
      valuation: {
        opsNpvBaselineMusd: opsNpvBaseline,
        opsNpvCloseMusd: opsNpvClose,
      },
    };
  });
}
