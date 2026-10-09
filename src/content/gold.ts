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
