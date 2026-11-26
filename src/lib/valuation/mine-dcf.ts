/**
 * =============================================================================
 * mine-dcf.ts — simple producing-mine NAV (Excel Mine DCF port)
 * =============================================================================
 *
 * Pre-tax cash flow = (gold − AISC) × annual production.
 * After-tax CF = pre-tax × (1 − tax_rate). Default tax 30%, discount 5%.
 * Flat production / price / cost over reserve life; partial last year; life capped at 30.
 * Corporate NAV = sum(mine NPVs) + cash − debt.
 *
 * Two modes:
 *   mine_dcf_v1      — roll up mine rows (blank mine AISC → company AISC)
 *   company_proxy_v1 — one synthetic mine from consolidated production / reserves / AISC
 */

export const DEFAULT_DISCOUNT_RATE = 0.05;
export const DEFAULT_TAX_RATE = 0.3;
export const MAX_LIFE_YEARS = 30;

export type MineDcfInput = {
  /** Annual payable production, ounces (not koz). */
  annualProductionOz: number;
  /** Recoverable P&P, thousand ounces. */
  recoverableReservesKoz: number;
  /** Effective AISC $/oz (already resolved: mine or company fallback). */
  aiscPerOz: number;
};

export type CompanyDcfInput = {
  mines: MineDcfInput[];
  cashMusd: number;
  debtMusd: number;
  goldPriceUsd: number;
  discountRate?: number;
  taxRate?: number;
};

export type MineNpvResult = {
  annualCfMusd: number;
  lifeYears: number;
  npvMusd: number;
};

export type CompanyNavResult = {
  mineNpvs: MineNpvResult[];
  opsNpvMusd: number;
  navMusd: number;
};

/** Discount flat annual CF over life years (partial final year). */
export function npvFlatCashFlow(
  annualCfMusd: number,
  lifeYears: number,
  discountRate: number,
): number {
  if (annualCfMusd === 0 || lifeYears <= 0) return 0;
  const life = Math.min(lifeYears, MAX_LIFE_YEARS);
  const fullYears = Math.floor(life);
  const fraction = life - fullYears;
  let npv = 0;
  for (let t = 1; t <= fullYears; t += 1) {
    npv += annualCfMusd / (1 + discountRate) ** t;
  }
  if (fraction > 1e-9) {
    npv += (annualCfMusd * fraction) / (1 + discountRate) ** (fullYears + 1);
  }
  return npv;
}

export function mineNpvAtGold(
  mine: MineDcfInput,
  goldPriceUsd: number,
  discountRate: number,
  taxRate: number,
): MineNpvResult {
  const margin = goldPriceUsd - mine.aiscPerOz;
  const annualCfPre = (margin * mine.annualProductionOz) / 1e6;
  const annualCf = annualCfPre * (1 - taxRate);
  const lifeYears =
    mine.annualProductionOz > 0
      ? (mine.recoverableReservesKoz * 1000) / mine.annualProductionOz
      : 0;
  return {
    annualCfMusd: annualCf,
    lifeYears,
    npvMusd: npvFlatCashFlow(annualCf, lifeYears, discountRate),
  };
}

export function computeCompanyNav(input: CompanyDcfInput): CompanyNavResult {
  const discountRate = input.discountRate ?? DEFAULT_DISCOUNT_RATE;
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const mineNpvs = input.mines.map((mine) =>
    mineNpvAtGold(mine, input.goldPriceUsd, discountRate, taxRate),
  );
  const opsNpvMusd = mineNpvs.reduce((sum, row) => sum + row.npvMusd, 0);
  return {
    mineNpvs,
    opsNpvMusd,
    navMusd: opsNpvMusd + input.cashMusd - input.debtMusd,
  };
}

/** Build a single synthetic mine from consolidated company fields. */
export function companyProxyMine(args: {
  productionKoz: number;
  reservesMoz: number;
  aiscPerOz: number;
}): MineDcfInput {
  return {
    annualProductionOz: args.productionKoz * 1000,
    recoverableReservesKoz: args.reservesMoz * 1000,
    aiscPerOz: args.aiscPerOz,
  };
}

export function priceToNav(marketCap: number | null, navMusd: number | null): number | null {
  if (marketCap == null || navMusd == null || navMusd <= 0) return null;
  return marketCap / 1e6 / navMusd;
}
