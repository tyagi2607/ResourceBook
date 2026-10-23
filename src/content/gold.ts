/**
 * gold.ts — editorial text for the Gold Overview page.
 *
 * This file is plain data so you can edit wording without touching layout code.
 * Keep statements qualitative or sourced. Hard numbers belong in the database,
 * where they carry an as-of date.
 */

/** A citation shown under a claim. `asOf` is when the figure was published. */
export type SourceLink = { label: string; href: string; asOf?: string };

/** "Why gold" intro, shown above the driver strip (docs/08, "Why gold: the intro"). */
export const GOLD_INTRO: string[] = [
  "Gold has served as money across civilizations for thousands of years, and central banks still hold it as a reserve asset today. It has no issuer, so it can't default or be printed.",
  "Over long periods it has tended to hold its purchasing power, which is why it's called an inflation hedge. It is not a smooth one: the January 1980 high of about $850 an ounce wasn't surpassed until 2008.",
];

export type DriverId = "central-banks" | "deficits" | "geopolitics" | "real-rates";

export type ThesisCard = {
  /** Also the anchor on /gold/why, e.g. /gold/why#real-rates. */
  id: DriverId;
  title: string;
  body: string;
  /** What an investor can monitor to track this driver. */
  watch: string;
};

/** "Why Gold" — the main macro drivers (PLAN.md §4.2). Full sections live on /gold/why. */
export const GOLD_DRIVERS: ThesisCard[] = [
  {
    id: "central-banks",
    title: "Central bank buying",
    body: "Central banks have been steady net buyers in recent years, diversifying reserves away from any single currency. Official-sector demand is price-insensitive and tends to persist.",
    watch: "Monthly official reserves reported to the IMF",
  },
  {
    id: "deficits",
    title: "Deficits and debt",
    body: "Large, persistent government deficits raise questions about the long-run purchasing power of fiat currencies. Gold has no issuer, no credit risk, and can't be printed.",
    watch: "Government debt and deficits as a share of GDP",
  },
  {
    id: "geopolitics",
    title: "Geopolitical risk",
    body: "Gold has historically been sought during conflict, sanctions, and financial stress. Physical metal held in your own custody sits outside the banking system.",
    watch: "Sanctions activity, shipping choke points, reserve diversification",
  },
  {
    id: "real-rates",
    title: "Real interest rates",
    body: "Gold pays no yield, so its opportunity cost falls when inflation-adjusted (real) rates fall. Rising real rates and a strong US dollar are the classic headwinds.",
    watch: "US 10-year TIPS yield, US dollar index (DXY)",
  },
];

/* ---------------------------------------------------------------------------
 * Geopolitics (editorial, reviewed quarterly). Every hard number carries a source.
 * Poland and China "proof" cards pull their tonnes live from the reserves table.
 * ------------------------------------------------------------------------- */

export const GEOPOLITICS_REVIEWED_ON = "2026-10-09";

export type GeopoliticsChannel = {
  title: string;
  body: string;
  sources: SourceLink[];
};

export const GOLD_GEOPOLITICS: GeopoliticsChannel[] = [
  {
    title: "Weaponization of the dollar",
    body: "After Russia invaded Ukraine in 2022, Western governments immobilized about $300 billion of Russian central bank assets. Reserves held as foreign bonds and deposits can be frozen by the countries that issue or hold them; gold stored at home can't.",
    sources: [
      {
        label: "REPO Task Force joint statement (G7, EU, Australia)",
        href: "https://www.gov.uk/government/publications/russian-elites-proxies-and-oligarchs-task-force-joint-statement--2/russian-elites-proxies-and-oligarchs-task-force-joint-statement",
        asOf: "June 2022",
      },
    ],
  },
  {
    title: "Choke points and energy inflation",
    body: "About a fifth of the world's oil consumption passes through the Strait of Hormuz, and Red Sea attacks have rerouted shipping around Africa. Disruptions raise energy prices, which feed inflation, a classic support for gold.",
    sources: [
      {
        label: "U.S. EIA: The Strait of Hormuz is the world's most important oil transit chokepoint",
        href: "https://www.eia.gov/todayinenergy/detail.php?id=65504",
        asOf: "2025",
      },
      {
        label: "U.S. EIA: Short-Term Energy Outlook, energy security (chokepoint flows)",
        href: "https://www.eia.gov/outlooks/steo/report/energysecurity/article.php",
        asOf: "May 2026",
      },
    ],
  },
  {
    title: "De-dollarization",
    body: "74% of central banks surveyed expect the US dollar's share of global reserves to be lower in five years, and a record 45% plan to increase their own gold holdings over the next year.",
    sources: [
      {
        label: "World Gold Council, Central Bank Gold Reserves Survey 2026",
        href: "https://www.gold.org/goldhub/research/central-bank-gold-reserves-survey-2026",
        asOf: "June 2026",
      },
    ],
  },
];

/** The one number shown for geopolitics on the /gold driver strip (sourced above). */
export const GEOPOLITICS_HEADLINE = {
  value: "74%",
  caption: "of central banks expect a smaller US dollar share of reserves in 5 years (WGC survey, 2026)",
};

/** Countries highlighted as real-world proof; tonnes come from the reserves table. */
export const GEOPOLITICS_PROOF: { iso3: string; title: string; body: string }[] = [
  {
    iso3: "POL",
    title: "Poland",
    body: "A frontline NATO state on Russia's border, and one of the largest official buyers in recent years. Its central bank presents gold as part of the country's financial security.",
  },
  {
    iso3: "CHN",
    title: "China",
    body: "Reports steady official purchases while its holdings of US Treasuries have trended down, and imports large volumes of bullion for private demand.",
  },
];

/* ---------------------------------------------------------------------------
 * Real rates explainer (numbers in the live strip come from FRED)
 * ------------------------------------------------------------------------- */

export const REAL_RATE_EXAMPLES = [
  {
    nominal: 5.28,
    inflation: 2.36,
    takeaway: "Bonds pay a solid return above inflation, so holding gold (which pays nothing) has a high opportunity cost.",
  },
  {
    nominal: 3.0,
    inflation: 5.0,
    takeaway: "Cash and bonds lose purchasing power, so the opportunity cost of holding gold disappears.",
  },
];

export const LONGTERMTRENDS_LINK: SourceLink = {
  label: "LongtermTrends: Gold vs. (inverted) real 10-year Treasury yield",
  href: "https://www.longtermtrends.com/gold-vs-real-yields/",
};

export type SupplyDemandItem = { label: string; note: string };

/** Light supply/demand preview. A full specialty page comes later. */
export const GOLD_SUPPLY: SupplyDemandItem[] = [
  {
    label: "Mine production",
    note: "Roughly three-quarters of annual supply. Slow to respond: a discovery typically takes a decade or more to become a producing mine.",
  },
  {
    label: "Recycling",
    note: "The flexible part of supply. Scrap selling tends to rise when prices spike.",
  },
];

export const GOLD_DEMAND: SupplyDemandItem[] = [
  {
    label: "Jewelry",
    note: "Historically the largest single category, led by China and India. Price-sensitive.",
  },
  {
    label: "Investment",
    note: "Bars, coins, and physically backed ETFs. The swing factor in most years.",
  },
  {
    label: "Central banks",
    note: "Reserve diversification. A structurally larger buyer than a decade ago.",
  },
  {
    label: "Technology",
    note: "Electronics and dental. Small and stable.",
  },
];

export const GOLD_SUPPLY_DEMAND_SOURCE = {
  label: "World Gold Council — Gold Demand Trends",
  href: "https://www.gold.org/goldhub/research/gold-demand-trends",
};

/* ===========================================================================
 * Physical page (/gold/physical) — docs/10-gold-physical.md
 * ========================================================================= */

export const PHYSICAL_INTRO =
  "Ways to own gold itself rather than mining companies: exchange-traded funds and trusts that hold bullion in a vault for you, or coins and bars bought from a dealer.";

export type VehicleStructure = "etf" | "trust" | "receipt";

/** Plain-language explanation of each fund structure (shown as cards above the table). */
export const VEHICLE_STRUCTURES: Record<VehicleStructure, { label: string; body: string }> = {
  etf: {
    label: "ETF",
    body: "Shares backed by gold in a vault. Large traders create and redeem shares every day, which keeps the price very close to the value of the gold behind it. Ordinary investors generally can't swap shares for metal.",
  },
  trust: {
    label: "Physical trust",
    body: "A trust that holds allocated bullion and rarely issues new units, so its price can drift above or below the value of its gold (a premium or discount). Unitholders can redeem for bars, subject to minimum sizes and fees.",
  },
  receipt: {
    label: "Exchange-traded receipt",
    body: "Receipts issued by the Royal Canadian Mint, a federal Crown corporation, for gold it stores. Holders can exchange receipts for Mint bars and coins, subject to minimums and fees.",
  },
};

/** Why the table has no premium/discount column yet (decided 2026-10-10, docs/10). */
export const PREMIUM_NOTE =
  "No premium/discount column yet. For ordinary ETFs it stays close to zero, because large traders arbitrage it away. Our free price feed reports fund NAVs without a date, so a premium computed from it could be wrong. Dated NAVs from the issuers of the Sprott trust and the Mint receipts, where premiums can be meaningful, are planned.";

/** Hover hints for the fund table's column headers. */
export const VEHICLE_COLUMN_HINTS = {
  fee: "Annual expense ratio: the share of your holding the fund charges each year.",
  assets: "Total assets held by the fund, in its trading currency.",
  traded: "Average value of shares traded per day over the last 30 sessions. Higher means easier to buy and sell at a tight price.",
  redeem: "Whether ordinary unitholders can exchange units for physical metal.",
};

export const DEALER_NOTE =
  "A short, curated list, not endorsements, and no affiliate links. Dealers charge a premium over the gold price when you buy and pay below it when you sell back; storage and insurance are up to you unless the dealer offers them.";

/* ===========================================================================
 * Companies page (/gold/companies) — docs/11-gold-companies.md
 * ========================================================================= */

export const COMPANIES_INTRO =
  "Gold equities along the Lassonde curve — royalties, producers, developers, and explorers — plus miner ETFs for sector exposure. Open a ticker for mines, management, and how costs look at the company's gold-price assumption versus today's spot.";

export const REPORTED_VS_SPOT_NOTE =
  "Companies report AISC and often illustrate margins or NAV at a planning gold price. We store that assumption. Spot margin uses our latest gold futures close; assumption margin uses the company's price. We do not re-run a full NAV at spot yet.";

export const TIER_TABS: { id: string; label: string; href: string }[] = [
  { id: "all", label: "All", href: "/gold/companies" },
  { id: "royalty", label: "Royalty & Streaming", href: "/gold/companies?tier=royalty" },
  { id: "producer", label: "Producers", href: "/gold/companies?tier=producer" },
  { id: "developer", label: "Developers", href: "/gold/companies?tier=developer" },
  { id: "explorer", label: "Explorers", href: "/gold/companies?tier=explorer" },
  { id: "miner_etf", label: "Miner ETFs", href: "/gold/companies?tier=miner_etf" },
];

export const DETAIL_TABS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "management", label: "Management" },
  { id: "mines", label: "Mines" },
  { id: "sources", label: "Sources" },
];

export const ROLE_LABELS: Record<string, string> = {
  ceo: "Chief Executive Officer",
  cfo: "Chief Financial Officer",
  coo: "Chief Operating Officer",
  other: "Other",
};

export const SOURCE_KIND_LABELS: Record<string, string> = {
  aif: "AIF / 40-F",
  reserves: "Reserves & resources",
  presentation: "Corporate presentation",
  mda: "MD&A / results",
  other: "Other",
};

export const MINE_STATUS_LABELS: Record<string, string> = {
  operating: "Operating",
  construction: "Construction",
  development: "Development",
  care_maintenance: "Care & maintenance",
};

export const COMPANY_COLUMN_HINTS = {
  aisc: "All-in sustaining cost per ounce, as reported (company consolidated guidance).",
  spotMargin: "Today's gold futures close minus reported AISC. Higher means more cash per ounce at spot.",
  assumptionMargin: "Company planning gold price minus reported AISC.",
  reserves: "Proven and probable gold reserves, million ounces.",
  production: "Annual attributable production guidance, thousand ounces (midpoint when a range).",
  reserveLife: "P&P reserves ÷ annual production.",
  nav: "Curated company net asset value (million USD) at the gold price the source used.",
};
