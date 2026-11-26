# 10 — Gold Physical page (`/gold/physical`)

**Status:** Built 2026-10-10 (PLAN.md build step 5), except the premium/discount history chart,
which waits for dated NAVs (see below).

**Job (PLAN.md §4.3):** ways to own gold itself, not mining shares: funds that hold bullion in
a vault, and dealers that sell coins and bars. Everything is filtered by one market switch.

---

## What's on the page

| Section | What it shows | Data |
| --- | --- | --- |
| Market switch | **USA — USD** (default) or **Canada — CAD** | The URL: `/gold/physical` or `/gold/physical?market=ca` |
| Fund types | One card per structure in the list: ETF, physical trust, exchange-traded receipt | `VEHICLE_STRUCTURES` in `src/content/gold.ts` |
| Gold funds table | Sortable: fund, type, price, 1-day change, fee, assets, traded per day, vault, redeemable for metal | `vehicles` + `vehicle_daily` |
| Source note | Yahoo (prices, assets, volume), issuer websites (fees, vault, structure), why there's no premium column, "Updated <date>" | `data_refresh_log` (`yahoo_daily`) |
| Bullion dealers | Cards: name (link), city, what they sell, notes, plus a "not endorsements" note | `dealers` |

### Columns, in plain terms

| Column | Meaning | Where it comes from |
| --- | --- | --- |
| Fund | Ticker (links to the issuer's page); fund name and issuer underneath | `data/seed/vehicles.csv` |
| Type | ETF, physical trust, or receipt; exchange underneath | Seed CSV |
| Price | Last close, in the fund's own currency (US$ or CA$) | Yahoo, daily |
| 1 day | Change from the previous close | Yahoo, daily |
| Fee / yr | Expense ratio: what the fund charges per year | Seed CSV, from issuer sites (three Canadian funds from Yahoo, flagged in the CSV `notes` to verify) |
| Assets | Total assets the fund holds, in its currency | Yahoo `totalAssets`, daily. Missing for KILO, ZGLD, PHYS |
| Traded / day | Average of price × shares traded over the last 30 sessions: how easy the fund is to trade | Computed from `vehicle_daily` when the page loads |
| Vault | Where the gold is stored | Seed CSV |
| Redeem for metal | Can an ordinary holder swap units for bars or coins? | Seed CSV |

Hover over a column header to see a short explanation. The default sort is by assets, largest
first. Empty values always sort to the bottom.

---

## NAV and premium/discount

**Decision (2026-10-10): no premium/discount column yet.** The page says why in one line under
the table (`PREMIUM_NOTE` in `src/content/gold.ts`).

What we found when we checked Yahoo:

- Yahoo reports a NAV (`navPrice`) for GLD, IAU, CGL.C, MNT, KILO, and ZGLD, but **not for PHYS**.
- The NAV has **no date**. GLD's was 381.03, which matched none of its last six closes
  (375.88 to 382.76). A premium computed from it could be off by more than a real premium.
- For ordinary ETFs the premium is close to zero anyway: large traders create and redeem shares
  daily, which keeps price and NAV together.

So we don't store Yahoo's NAV (`etl_yahoo.py`, `fund_assets()` docstring).

**Where the premium matters, and the plan:**

| Fund | Why it can trade away from NAV | Plan |
| --- | --- | --- |
| PHYS (Sprott Physical Gold Trust) | Closed-end trust; new units are issued only occasionally | Load Sprott's published daily NAV with its date into `nav_per_share` and `nav_as_of`, after checking Sprott's website terms |
| MNT (Royal Canadian Mint ETR) | Receipts are issued and redeemed less freely than ETF shares | Same, from the Mint's published NAV, after checking its terms |

Once a fund has a dated NAV:

- Postgres computes `premium_discount_pct` automatically (it's a generated column, see doc 06).
- The table shows a **Premium** column automatically (it appears when any fund in the list has
  one), with the NAV date underneath.
- The history chart (PLAN.md §4.3, "Analytics") can be built from `vehicle_daily`.

### Fund NAV vs company NAV (not the same thing)

- **Fund NAV:** the value of the gold the fund holds, per share. Published daily by the issuer.
- **Company NAV** (Companies page, later): an estimate of what a mining company's reserves and
  projects are worth, from its technical reports or analyst models. It isn't on Yahoo. Neither
  are proven and probable reserves, which come from NI 43-101 (Canada) or S-K 1300 (US) reports
  and annual reserve statements.

---

## How the market switch works

The switch is two plain links. The selected market lives in the URL (`?market=ca`), so:

- The server reads it and queries only that market's funds and dealers.
- A view can be bookmarked or shared.
- The page is rendered for each visit rather than cached, which is cheap: three small queries.

In Next.js 16, the page receives `searchParams` as a Promise and must `await` it.
`parseMarket()` treats anything other than `ca` as the default, USA.

---

## Files

| File | Role |
| --- | --- |
| `src/app/gold/physical/page.tsx` | The page: reads the market, runs the queries in parallel, lays out sections |
| `src/lib/data/gold-physical.ts` | `getVehicles(market)`, `getDealers(market)`, `parseMarket()` |
| `src/lib/data/query-helpers.ts` | Shared query helpers (`safely`, `fetchAllPages`, `average`, …), also used by `gold-macro.ts` |
| `src/components/ui/DataTable.tsx` | Reusable sortable table (client component); the Companies page will reuse it |
| `src/components/physical/VehicleTable.tsx` | Formats funds into table rows |
| `src/components/physical/StructureCards.tsx` | The fund-type explainer cards |
| `src/components/physical/MarketSwitch.tsx` | USA / Canada toggle |
| `src/components/physical/DealerList.tsx` | Dealer cards |
| `src/content/gold.ts` | All wording: intro, fund types, column hints, premium note, dealer note |
| `src/lib/format.ts` | New: `formatCompactPrice` ("$141.7B", "CA$3.1B"), `formatFractionPercent` (0.004 → "0.40%") |

## How to edit

- **Add or change a fund:** edit `data/seed/vehicles.csv` (set `country` to `US` or `CA`), then
  run `.venv\Scripts\python.exe scripts\seed_database.py` and `scripts\etl_yahoo.py` for prices.
  The seed overwrites every column, so a blank cell in the CSV clears that value in the database.
- **Add or change a dealer:** edit `data/seed/dealers.csv`, then re-run the seed.
- **Change wording:** `src/content/gold.ts`, section "Physical page".
