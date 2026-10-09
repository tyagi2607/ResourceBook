# 08 — Gold Overview data plan (per datapoint)

**Status:** ✅ Implemented 2026-10-09 (phases A–E). Plan agreed the same day (see
[Decisions](#decisions-2026-10-09) at the end). Where the build differs from the plan below, the
[As built](#as-built-2026-10-09) section wins.
**Scope:** The extra datapoints for `/gold`: the cards, the "Why gold" intro, central banks,
debt and deficits, geopolitics, and real rates.

## As built (2026-10-09)

What changed between the plan and the code, so you don't have to diff them yourself:

| Topic | Plan said | What we built, and why |
| --- | --- | --- |
| Central bank source | Hand-edited CSV first, IMF script later | **IMF script now** (`scripts/fetch_imf_gold_reserves.py`). The IMF API worked on the first day, so the CSV stopgap wasn't needed. The CSV loader (`scripts/load_manual_data.py`) and an empty template (`data/manual/central_bank_gold_reserves.csv`) still exist; if you add rows, IMF rows win for the same country and month. |
| FRED access | Free API key (`FRED_API_KEY`) | **No key needed.** The script downloads FRED's public CSV (`fredgraph.csv`). |
| Schedules | Four jobs on four schedules | **Two workflows:** `data-daily.yml` (weekdays 22:30 UTC: Yahoo ETL, then FRED) and `data-monthly.yml` (10th of each month, 09:00 UTC: IMF reserves, then IMF fiscal). |
| `vehicle_daily.volume` | New column | Already existed in the first migration; only `commodity_daily` got new columns (`open_price`, `high_price`, `low_price`, `volume`). |
| Reserves cleaning | Convert ounces to tonnes | Also: **revalue gold at market** where a country books it at a historical price (the US at $42.22/oz), **fix volumes reported 1,000× too large** (Brazil, Angola), and **skip months where volume and value contradict each other** (Chile 2026, Costa Rica 2016). Countries whose latest report is more than 6 months old are left out of the tables. All of this is stated on the page. |
| Central bank sector | — | IMF reports "monetary authorities" (`S1XS1311`) for most countries; we use it where present, otherwise the whole-economy series (`S1X`). |
| Futures card citation | "Previous session close" | "COMEX, latest daily close. Not live." |

**Live numbers at launch (2026-10-09):** gold futures $4,220.30; GLD volume 0.58× ("Quiet");
real yield 2.87% (5.22% nominal − 2.35% breakeven); US debt 125.8% of GDP with a 7.5% deficit;
top 12-month buyers Poland +133 t, China +84 t, Kazakhstan +61 t.

**How to run and check each job:** see [09 — Data jobs](./09-data-jobs.md).

For each datapoint this doc answers:

1. **Display:** what the visitor sees on the page.
2. **Source:** where the numbers come from, and whether we are allowed to republish them.
3. **Storage:** where the data lives (a content file, a Supabase table, or not stored).
4. **Updates:** how the data gets refreshed (by hand, a script, or live) and how often.
5. **Citation:** the credit line we show next to it.

---

## Summary

| Datapoint | Display | Source | Storage | Refresh |
| --- | --- | --- | --- | --- |
| Hub mark (RB coin on Gold) | Beside the "Gold hub" label; each hub gets its own mark and colour | Our own SVG | Code (`src/components/brand`) | Never |
| Spot price | Live quote card (built) | TradingView `OANDA:XAUUSD` | Not stored | Live |
| Futures price | "Gold futures, last close" card | Yahoo `GC=F` | `commodity_daily` | Daily |
| Volume signal | "Volume vs normal" card | Yahoo daily volume | `commodity_daily.volume` | Daily |
| Why gold intro | Short text block | Our writing | `src/content/gold.ts` | Review yearly |
| Central bank reserves | Top holders and top buyers | IMF reserves data (WGC only with permission) | `central_bank_gold_reserves` | Monthly |
| Debt and deficits | Top 10 economies table | IMF DataMapper API | `country_fiscal` | Twice a year |
| Geopolitics | 3 channel cards and "proof" cards | Our writing, with citations | `src/content/gold.ts` | Review quarterly |
| Real rates | Live card, formula, gold-vs-real-yield chart | FRED (DFII10, DGS10, T10YIE) | `macro_series` and `macro_observations` | Daily |

"Excel-first" option: any table-backed datapoint can start as a CSV file you edit in Excel (see
[Excel-first workflow](#excel-first-workflow)). The page reads the same Supabase table either
way, so switching to a script later doesn't change any page code.

---

## Licensing check (read first)

I checked each source's terms before planning around it.

| Source | Can we republish? | What we must do |
| --- | --- | --- |
| **World Gold Council (gold.org)** | **Not without written permission.** Their terms say you may not "copy, scrape, distribute… reproduce… publish" their content "without the prior written authorisation of WGC and with suitable accreditation". They also ban automated access ("other than using the Website's navigational structure") and commercial use without consent. CME and LBMA data on their site carry extra restrictions. | Email **info@gold.org** for permission (draft below). Until they reply: **no scraping, no automated login, and no republishing their downloaded Excel tables.** Linking to their pages is fine. |
| **IMF** (DataMapper, reserves data) | **Yes.** Their statistical data may be downloaded, published, and redistributed with attribution. | Show "Source: International Monetary Fund, …". Don't alter values (unit conversions must be stated). **Commercial reuse** needs a request to copyright@imf.org. No bulk automated downloading: our small, targeted API calls are fine. |
| **FRED** (St. Louis Fed) | **Yes** for the Federal Reserve series we use (DFII10, DGS10, T10YIE). | Cite each series (format below). No key needed for the public CSV download we use. |
| **US Treasury** real yield curve | **Yes.** US government data is public domain. | Credit "U.S. Department of the Treasury". |
| **TradingView widgets** | **Yes**, as embedded widgets only. | Keep the "by TradingView" link (already done). No copying their values into our database. |
| **Yahoo Finance** (`yfinance`) | **Unclear.** It's an unofficial library, and Yahoo's terms limit redistribution. | Fine for the MVP. Before any paid or commercial launch, move the ETL to a licensed data source (the schema stays the same). |
| **LongtermTrends** | Third-party site. | **Link only.** We build our own version of their chart from FRED data. |

**Is ResourceBook commercial?** If you plan ads, subscriptions, or paid features, the WGC and IMF
"commercial use" clauses apply, so put that in your permission requests.

### Draft email to WGC (info@gold.org)

> Subject: Permission request: Gold reserves by country data with attribution
>
> Hello, I'm building ResourceBook, an [educational / commercial: choose one] natural-resources
> analytics website. I would like to display a summary of your "Gold reserves by country" data
> (top holders and monthly changes, in tonnes and % of reserves) with clear accreditation to the
> World Gold Council and a link to Goldhub. I would update it monthly by downloading the file
> through my Goldhub account (no automated access). Could you tell me whether this is permitted,
> and what attribution wording you require? Thank you.

---

## Card visuals

### 1. Logo: hub marks (RB coin on Gold)

- **Display:** on Gold, a gold-coloured coin with **RB** in the middle, placed beside the "Gold hub"
  label above the "Gold overview" title. The site header and favicon stay as they are for now.
- **Limitation:** the TradingView quote widget draws its own icon inside its sealed frame, so we
  can't put our coin *inside* it.
- **Storage:** an SVG React component (`src/components/brand/HubMark.tsx`). Colours come from the
  hub's accent token, so it adapts to dark mode.
- **Updates:** none.
- **Every hub gets its own mark (decided 2026-10-09).** One `HubMark` component chooses the shape
  for each commodity. The colour comes from the hub's accent token (`data-commodity`, see
  [doc 04](./04-commodity-colors.md)), so each mark is automatically tinted and works in light and
  dark mode.

  | Hub | Mark | Colour |
  | --- | --- | --- |
  | Gold | Coin with **RB** | Gold accent |
  | Silver | Same coin with **RB** | Silver accent |
  | Copper | Same coin with **RB** | Copper accent |
  | Uranium (nuclear) | **Atom**: nucleus of protons and neutrons with orbiting electron rings (no RB text, too small to read inside) | Isotope green |
  | Oil | **Oil drop** with **RB** inside | Crude amber |
  | Gas | **Flame** with **RB** at its base | Methane blue |
  | Battery Metals | **Battery** outline, **RB** inside, small charge bolt on the cap | Cobalt indigo |

  - The three metals share one coin drawing and change only colour. Energy and uranium get a
    shape that says "this is not a metal".
  - Each mark is drawn as a simple outline so it stays readable at 24–32 px.
  - Placement is the same on every hub: beside the "<Commodity> hub" label above the page title.
    The non-gold "coming soon" pages show their mark too.

### 2. Spot price ✅ built

- **Display:** the existing TradingView quote card (price, change, previous close, open, day range).
- **Source:** TradingView `OANDA:XAUUSD`, the same feed as the chart, so they always match.
- **Storage:** not stored (TradingView forbids copying widget values).
- **Updates:** live in the visitor's browser.
- **Note:** the "volume" figure TradingView shows for OANDA spot is **tick volume** (the number of
  price updates), not ounces traded. The widget doesn't let us hide it, so the real volume signal
  comes from card 4.

### 3. Futures price

- **Tested 2026-10-09:** free TradingView widgets **block** COMEX gold futures (`COMEX:GC1!` and
  `COMEX_MINI:MGC1!` show "This symbol is only available on TradingView"). So a live futures quote
  is not possible for free.
- **Display:** a small card, "Gold futures (front month): $X, last close Oct 8". The label makes
  clear that it's the previous close, not live, so nobody expects it to match the live spot card
  exactly.
  - **Optional:** show the **basis** (futures − spot). It's normally a few dollars per ounce and
    reflects interest costs. This is a nice teaching point.
- **Source:** Yahoo `GC=F` (continuous front-month COMEX contract).
- **Storage:** `commodity_daily` (the table already exists). We'd add `open`, `high`, `low`, and
  `volume` columns.
- **Updates:** the daily Yahoo ETL (build step 8), around 22:30 UTC on weekdays, after the
  futures settle.
- **Citation:** "Futures data: Yahoo Finance, delayed. Previous session close."

### 4. Volume signal: "is trading busier than usual?"

- **Your idea:** recent volume compared with the yearly average. This is a standard
  **relative volume** measure.
- **Definition:** average daily volume over the last **5 trading sessions** (= 7 calendar days),
  divided by the average daily volume over the last **252 trading sessions** (≈ 365 calendar days).
  - Example: 1.40× means trading this week is 40% busier than a normal day this year.
- **Display:** the ratio, plus a word label:
  - ≥ 1.25×: "Above normal" (gold accent)
  - 0.80–1.25×: "Normal"
  - < 0.80×: "Quiet"
  - A tiny 30-day bar sparkline underneath.
- **Which volume?**
  - `GC=F` (futures contracts) has jumps around contract rollover dates, when trading shifts to the
    next month.
  - **GLD** (the largest gold ETF, shares traded) has no rollover artifacts and reflects investor
    flow. **Recommended:** GLD, or show both. *(Open decision.)*
- **Storage:** raw daily volume in Supabase. The ratio is **calculated when the page loads**, not
  stored, so we can change the formula without reprocessing data.
  - Futures volume goes in `commodity_daily.volume`; GLD volume in `vehicle_daily.volume` (new
    column).
- **Updates:** daily ETL. **One-time backfill** of 2 years of history so the 252-session average
  works on day one.
- **Citation:** "Volume: Yahoo Finance. Calculated by ResourceBook."

---

## Why gold: the intro

- **Display:** a 2–3 sentence intro above the four driver sections:
  - Gold has served as money across civilizations for thousands of years, and it remains a reserve
    asset for central banks today.
  - It has tended to preserve purchasing power over **long** periods, which is why it's called an
    inflation hedge.
  - Honest caveat (builds trust): it can underperform for long stretches. The January 1980 high
    wasn't regained in dollar terms until 2008, and took far longer after adjusting for
    inflation. (Check the exact dates against our own price history before publishing.)
- **Storage:** a `GOLD_INTRO` constant in `src/content/gold.ts` (same pattern as the existing
  cards).
- **Updates:** review yearly. No data feed.
- **Later (optional):** a "purchasing power" chart (gold vs US CPI) built from FRED data that
  we'll already be collecting.

---

## Central bank gold reserves

- **Display (three pieces):**
  1. **Top 10 holders**: table of country, tonnes, % of the country's reserves, change over 12
     months.
  2. **Biggest buyers, last 12 months**: horizontal bar chart. This is where Poland and China
     show up with live numbers, which feeds the geopolitics "proof" cards.
  3. **World official holdings over time**: line chart, optional.
- **Source options:**

  | Option | How | Pros | Cons |
  | --- | --- | --- | --- |
  | **A. WGC, with permission** | You download the monthly Excel by hand (in a browser, logged in); a script parses it | The familiar reference dataset; includes % of reserves | **Needs written permission first.** Automated login/Selenium is not allowed even with an account. |
  | **B. IMF reserves data** (recommended default) | Script calls the IMF data API (dataset **IRFCL**: gold volume in fine troy ounces and value, plus total reserves) | Free to republish with attribution; it's the official source WGC compiles from; fully automatable | ~1–2 month lag; a few countries report late; we convert ounces to tonnes ourselves |
  | **C. Manual CSV** | You type the top 10 and top buyers into `data/manual/central_bank_gold_reserves.csv` from IMF or national central bank releases | Ships immediately | Hand work each month |

  **Recommendation:** start with **B**, using **C** as a stopgap if the script isn't ready. Send
  the WGC email in parallel; if WGC approves, the parser for **A** writes into the same table.
- **Storage:** new table `central_bank_gold_reserves`:
  - `country_iso3`, `country_name`, `period` (month-end date)
  - `tonnes`, `value_usd`, `pct_of_reserves`
  - `source` (`imf` | `wgc` | `manual`), `retrieved_at`
  - Primary key `(country_iso3, period, source)`
  - Conversion: 1 tonne = 32,150.7466 troy ounces, stated on the page as a transformation.
- **Updates:** monthly script (scheduled for the 10th of each month), safe to re-run. If you go
  with WGC, you drop the new file into `data/sources/wgc/` (git-ignored, because we may not
  redistribute their raw file) and run the parser.
- **Citation (IMF):** "Source: International Monetary Fund, International Reserves and Foreign
  Currency Liquidity (IRFCL). Tonnes converted from fine troy ounces by ResourceBook."
- **Build note:** the IMF API endpoint responds (tested 2026-10-09). The exact gold indicator code
  will be confirmed when we write the script.

---

## Debt and deficits

- **Display:** a "Top 10 economies by GDP" table:
  - Columns: country · gross debt (% GDP) · fiscal balance (% GDP) · trend arrow vs 5 years ago.
  - Header label: e.g. "2026 estimates, IMF Fiscal Monitor, October 2026".
  - Debt cells are colour-scaled; Japan, Italy, and the US stand out.
  - Optional: US debt % GDP since 2000 as a sparkline.
- **Why automate instead of using your typed table:** your numbers mix sources and use ranges
  (e.g. US "6.8–7.5%"). A script pulls **one consistent IMF vintage**, picks the top 10 by GDP
  automatically, and labels which years are projections.
  - Expect small differences from your table, e.g. Germany's deficit will be a single number
    rather than a range.
- **Source:** IMF DataMapper API. No key needed; **tested 2026-10-09**.
  - `GGXWDG_NGDP`: general government gross debt, % of GDP
  - `GGXCNL_NGDP`: net lending/borrowing, % of GDP (a negative value is a deficit; we display it
    as "deficit 6.8%")
  - `NGDPD`: GDP in current USD, used only to rank the top 10
  - URL pattern: `https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP`
- **Storage:** new table `country_fiscal`:
  - `country_iso3`, `year`, `gross_debt_pct_gdp`, `fiscal_balance_pct_gdp`, `gdp_usd_bn`
  - `is_projection`, `vintage` (e.g. `2026-10`), `retrieved_at`
  - Primary key `(country_iso3, year)`
- **Updates:** the IMF publishes twice a year (April and October). The script is scheduled
  monthly, which is harmless because it overwrites identical values, so we never miss a release.
- **Citation:** "Source: International Monetary Fund, Fiscal Monitor / World Economic Outlook
  (October 2026), via IMF DataMapper."

---

## Geopolitics

This datapoint is mostly editorial, so it lives in the content file with citations. It isn't a
data feed.

- **Display:** three "channel" cards, then a "Proof in the data" strip.

  | Card | Point | Status |
  | --- | --- | --- |
  | Weaponization of the dollar | ~$300B of Russian central bank reserves frozen in 2022 showed that reserves held in someone else's system can be blocked. Gold held at home can't. | Widely reported. **Pick one primary citation** (e.g. G7/EU statement or Reuters). |
  | Choke points and energy inflation | Disruption at the Strait of Hormuz or the Red Sea raises energy prices, which feeds inflation. | **Add a cited figure** (e.g. EIA's share of world oil flowing through Hormuz) before publishing. |
  | De-dollarization | **74%** of central banks expect the US dollar's share of reserves to be lower in 5 years. | ✅ **Verified:** WGC Central Bank Gold Reserves Survey 2026 (press release 16 June 2026). Quoting a single survey figure with a link is low-risk, but include it in the WGC permission email. |

  - **Proof cards:**
    - **Poland:** frontline NATO state and one of the largest buyers.
    - **China:** steady official buying plus heavy bullion imports.
    - Both cards pull their **live tonnes** from the central bank table, so the numbers stay
      current without hand-editing the text.
- **Storage:** `GOLD_GEOPOLITICS` in `src/content/gold.ts`. Each card has
  `sources: { label, href, asOf }[]`, and the page shows a "Reviewed: <date>" line.
- **Updates:** review **quarterly**, or after a major event. Hard numbers come either from a
  cited source with its date or from our tables.

---

## Real rates

- **The idea (your formula):** real rate = nominal rate − inflation.
  - 5.28% − 2.36% = **+2.92%**: gold's opportunity cost is high (bonds pay a real return).
  - 3.00% − 5.00% = **−2.00%** (your note said "2.0%", but the result is negative): holding cash
    or bonds loses purchasing power, so the opportunity cost of holding gold, which yields nothing,
    disappears.
  - Gold usually moves **inversely** to real rates. The relationship weakened after 2022, when
    central-bank buying lifted gold even as real rates rose. That makes a good "drivers interact"
    talking point.
- **Display:**
  1. **Card:** "US 10-yr real yield: 2.92% (Oct 7, 2026)" with the 1-month change.
  2. **Live formula strip:** nominal 10-yr (DGS10) − expected inflation (T10YIE, the 10-yr
     breakeven) = real yield (DFII10), filled with today's numbers so the formula is a live
     example. *(By construction FRED's breakeven = nominal − TIPS yield, so the strip always adds
     up.)*
  3. **Chart:** gold price vs real yield since 2003, with the real-yield axis **inverted** so the
     inverse relationship shows up as two lines moving together. Built with Recharts from our own
     tables. This is our own version of the LongtermTrends chart, which we link to as "further
     reading".
- **Sources:**
  - **FRED** (primary): `DFII10` (real), `DGS10` (nominal), `T10YIE` (breakeven). Downloaded as
    public CSV, so no API key is needed.
  - **US Treasury** "Daily Treasury Par Real Yield Curve Rates" CSV as a backup.
  - **Gold history** for the chart: Yahoo `GC=F` daily closes, backfilled to 2003 into
    `commodity_daily`.
- **Storage:** two new generic tables, reusable for any future macro series (CPI, DXY, M2…):
  - `macro_series`: `series_id` (PK), `title`, `units`, `frequency`, `source`, `source_url`,
    `citation`
  - `macro_observations`: `series_id`, `obs_date`, `value`, primary key `(series_id, obs_date)`
- **Updates:** daily script after FRED's update (next business day). Backfill the full history
  once.
- **Citation:** "Board of Governors of the Federal Reserve System (US), Market Yield on U.S.
  Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis,
  Inflation-Indexed [DFII10], retrieved from FRED, Federal Reserve Bank of St. Louis;
  https://fred.stlouisfed.org/series/DFII10". The other two series follow the same format.

---

## Excel-first workflow

For any dataset where you'd rather start by hand:

1. Create `data/manual/<table_name>.csv`. Open and edit it in Excel, but **save as CSV**.
2. Columns match the Supabase table, plus `source`, `source_url`, and `as_of` on every row.
3. Run `python scripts/load_manual_data.py <table_name>`. It upserts the rows, so re-running is
   safe.
4. Later, an automated script writes to the **same table** with `source = 'imf'` (or `'fred'`), and
   the page doesn't change.

**Why CSV and not `.xlsx`?** Git shows CSV changes line by line, so you can see exactly what
changed each month, and scripts read it reliably. Excel opens CSV natively.

**Suggested starting mode per dataset:**

| Dataset | Start with |
| --- | --- |
| Debt and deficits | Script (the IMF API is easy and tested) |
| Real rates | Script (FRED) |
| Futures and volume | Script (part of the Yahoo ETL, step 8) |
| Central bank reserves | Manual CSV → IMF script (WGC if permission comes) |
| Geopolitics and intro | Content file (no table) |

---

## Keeping it updated (scheduling)

All jobs are Python scripts in `/scripts`, run on a schedule by **GitHub Actions**: free, and
secrets stay in GitHub, never in the code.

| Job | Schedule | Writes to |
| --- | --- | --- |
| Daily market (Yahoo: GC=F, GLD, ETFs, miners) | Weekdays 22:30 UTC | `commodity_daily`, `vehicle_daily`, … |
| Daily macro (FRED) | Weekdays 23:00 UTC | `macro_observations` |
| Central bank reserves (IMF) | 10th of each month | `central_bank_gold_reserves` |
| Fiscal (IMF DataMapper) | 15th of each month (data changes Apr/Oct) | `country_fiscal` |

Each job also writes one row to a small `data_refresh_log` table (job, ran_at, rows, status). The
page can then show **"Updated Oct 8"** under each section, and we can spot a broken job quickly.

The `/gold` page already rebuilds at most hourly (`revalidate = 3600`), so new data appears within
an hour of a job finishing.

---

## Proposed database changes (one new migration)

- `commodity_daily`: add `open`, `high`, `low`, `volume`
- `vehicle_daily`: add `volume`
- New tables (each gets public read, service-role write):
  - `macro_series`
  - `macro_observations`
  - `country_fiscal`
  - `central_bank_gold_reserves`
  - `data_refresh_log`

---

## Suggested build phases

| Phase | What | Depends on |
| --- | --- | --- |
| A | `HubMark` logos for all 7 hubs; intro text; geopolitics cards with citations | Nothing; content only |
| B | Migration; FRED and IMF fiscal scripts; real-rates card, formula, chart; debt table | Nothing (FRED turned out not to need a key) |
| C | Yahoo ETL with volume plus backfill (pulls build step 8 forward); futures card; volume signal; gold history for the real-rates chart | Phase B migration |
| D | Central bank reserves (manual CSV → IMF script; WGC parser if approved) | Source decision and WGC reply |
| E | GitHub Actions schedules and the `data_refresh_log` "Updated" labels | Phases B–D |

## Decisions (2026-10-09)

| Question | Decision |
| --- | --- |
| Central bank source | **Start with a hand-edited CSV** (`data/manual/central_bank_gold_reserves.csv`) built from IMF or national central bank releases, **not** copied from WGC files. Automate with the IMF script later. |
| Volume signal basis | **GLD** shares traded (no futures-rollover jumps) |
| Logo placement | **On the hub page header**: the coin sits beside the "Gold hub" label, above the "Gold overview" title. Not in the site header or favicon for now. |
| Page length | **Split:** a compact driver strip on `/gold` (one live number per driver) links to a new **`/gold/why`** page with the full tables and charts |
| Commercial intent | **Free and educational now, commercial eventually.** Permission requests should say so, and the Yahoo data source must be replaced with a licensed one before any commercial launch. |

### What the decisions change

- **Logo:** a `HubMark` SVG component placed in each hub's page header: a coin for gold, silver,
  and copper (tinted per hub), an atom for uranium, a drop for oil, a flame for gas, and a battery
  for battery metals. See [card 1](#1-logo-hub-marks-rb-coin-on-gold).
- **`/gold` keeps:** the quote cards (spot, ratio, futures last close, GLD volume signal), the chart,
  the intro, a **driver strip** (4 tiles, each with one live number), supply and demand,
  leaderboards, and ways to own.
  - Driver strip tiles: e.g. "Central banks: Poland +X t in 12 months", "US debt 123% of GDP",
    "74% expect a lower USD share", "Real yield 2.92%".
- **New `/gold/why`:** the full sections (central bank tables and charts, the debt and deficits
  table, geopolitics cards with citations, the real-rates formula and chart).
  - Add "Why gold" to the Gold dropdown menu as item 2, after Overview.
- **Central bank CSV columns:** `country_iso3, country_name, period, tonnes, pct_of_reserves,
  source, source_url, as_of`. Each row cites where the number came from: an IMF data page or a
  central bank press release. Since we're starting by hand, keep it small: the top 10 holders plus
  the top 5 buyers over 12 months.
- **WGC email:** optional now. Send it once the site is closer to commercial (state "educational
  now, commercial later").
