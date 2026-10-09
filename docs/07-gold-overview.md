# 07 — Gold Overview page (`/gold`)

The Gold hub's landing page: where gold trades, why it moves, and how to own it.

## Sections and where their data comes from

| Section | Source | Fills in when |
| --- | --- | --- |
| Live quote: spot, 1-day change, previous close, open, day's range | TradingView Symbol Info widget (`OANDA:XAUUSD`) | Already live |
| Gold/silver ratio | TradingView Single Quote widget (`OANDA:XAUUSD/OANDA:XAGUSD`) | Already live |
| Gold futures, latest daily close | `commodity_daily` (Yahoo `GC=F`) | Live (daily ETL) |
| Volume vs normal (GLD) | `vehicle_daily.volume`: 5-session average ÷ 252-session average | Live (daily ETL) |
| Price chart | TradingView Advanced Chart (`OANDA:XAUUSD`) | Already live |
| Why gold intro + driver strip (4 tiles with one live number each) | `src/content/gold.ts` + the macro tables; each tile links to `/gold/why` | Live; see [doc 08](./08-gold-overview-data-plan.md) |
| Supply and demand | `src/content/gold.ts` | Already live |
| Top gainers / decliners | `companies.change_pct` | Live (daily ETL) |
| Lowest AISC producers | `companies.aisc_per_oz` (tier = producer) | You add AISC values to `companies.csv` and re-seed |
| Ways to own gold (counts) | Row counts of `vehicles`, `dealers`, `companies`, `miner_etfs` | Already live |

Empty sections show a short message explaining what will fill them, rather than blank boxes.

## Why the headline numbers come from TradingView, not our database

The quote cards and the chart use the **same TradingView feed** (OANDA spot prices), so the
numbers above the chart always match the chart. Our database gets prices from Yahoo, which
has no gold *spot* price, only the futures contract `GC=F`. Futures usually trade a few
dollars above spot, so Yahoo-based cards would never quite match the chart.

Trade-offs of this choice:

- TradingView widgets are sealed iframes. They display numbers but our code can't read them,
  so they can't feed calculations, rankings, or history.
- No free widget shows a 52-week range for spot gold, so we dropped that stat. The chart opens
  on a 12-month view, which shows the range visually.
- The quote card and chart each update on their own, so for a moment they can differ by a few
  cents. They converge on the next tick.

Yahoo data in Supabase still powers everything that needs stored numbers: leaderboards, ETF
premium/discount, and history charts.

## Files

| File | What it does |
| --- | --- |
| `src/app/gold/page.tsx` | The page layout. Reads data once, then arranges the sections. |
| `src/lib/data/gold-overview.ts` | Supabase queries for the leaderboards and counts (the SQL is described in comments). |
| `src/lib/data/gold-macro.ts` | Queries for the futures and volume cards, the driver strip, and all of `/gold/why`. |
| `src/components/overview/MarketCards.tsx` | Futures and volume cards. |
| `src/components/overview/DriverStrip.tsx` | The 4 driver tiles. |
| `src/content/gold.ts` | Editorial text: Why Gold cards, supply/demand notes, source link. |
| `src/components/overview/Leaderboard.tsx` | Reusable ranked list with an empty state. |
| `src/components/charts/TradingViewWidget.tsx` | Embeds any TradingView widget; follows the site's light/dark theme. |
| `src/components/charts/TradingViewQuotes.tsx` | Quote card + optional ratio card. |
| `src/components/charts/TradingViewChart.tsx` | Interactive price chart. |
| `src/lib/format.ts` | Percent and price formatting. Missing values show "—". |

The quote, chart and leaderboard components take the symbol as a setting, so other hubs can
reuse them (e.g. silver would use `OANDA:XAGUSD`).

## How fresh is the data?

The page is a **Server Component**: Next.js queries Supabase on the server and sends finished HTML.

```ts
export const revalidate = 3600;
```

This line means Next.js builds the page, serves that copy to every visitor, and rebuilds it
in the background **at most once an hour**. The database only changes daily, so this is
plenty and keeps Supabase usage tiny. In `npm run dev` the page is rebuilt on every refresh,
though it can briefly reuse an earlier database fetch; restart the dev server if a reload doesn't
show up.

The TradingView quotes and chart are separate: they load in the visitor's browser and are always live.

## If Supabase is down

`getGoldOverviewData()` catches errors, logs them on the server, and returns empty values.
The page still renders, with a notice saying "Some data couldn't be loaded right now".

## Editing content

- **Why Gold / supply and demand wording:** edit `src/content/gold.ts`. Keep claims qualitative
  or sourced; hard numbers belong in the database with an as-of date.
- **Quote, ratio and chart symbols:** set in `src/app/gold/page.tsx` (`OANDA:XAUUSD`,
  `OANDA:XAUUSD/OANDA:XAGUSD`). TradingView divides "A/B" symbols live.
- **Leaderboard size:** `LEADERBOARD_SIZE` in `src/lib/data/gold-overview.ts`.

## Known notes

- The "All producers" link goes to `/gold/companies?tier=producer`. The Companies page will
  read that filter when it's built (step 6).
- TradingView's terms require the "Chart by TradingView" attribution under the chart. The
  quote widgets carry TradingView's own logo.
- In development, Cursor's built-in browser can show a "hydration" warning about
  `data-cursor-ref` attributes. That comes from the browser tool, not our code, and doesn't
  appear in a normal browser.
