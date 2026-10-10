# 02 — Project structure

## Top level

```
ResourceBook/
├── PLAN.md                 # Product / MVP decisions (source of truth)
├── README.md               # Repo intro + pointer to PLAN + docs
├── docs/                   # How-to docs (you are here)
├── .github/workflows/      # Scheduled data jobs on GitHub (daily + monthly)
├── data/seed/              # Starter CSVs loaded into Supabase
├── data/manual/            # Optional hand-edited CSVs (Excel-first data)
├── scripts/                # Python: seed, check, and the data jobs (Yahoo, FRED, IMF)
├── supabase/migrations/    # Database schema (SQL), run in date order
├── package.json            # Dependencies + npm scripts
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── public/                 # Static files (images, icons)
└── src/                    # Application source code
```

## Inside `src/` (App Router)

```
src/
├── app/                       # Routes = folders
│   ├── layout.tsx             # Site chrome (header/footer/theme)
│   ├── page.tsx               # Home  →  URL /
│   ├── globals.css            # Global styles + theme tokens
│   ├── gold/
│   │   ├── page.tsx           # /gold
│   │   ├── why/page.tsx       # /gold/why (the four drivers, with data)
│   │   ├── physical/page.tsx  # /gold/physical
│   │   └── companies/page.tsx # /gold/companies
│   └── [commodity]/page.tsx  # /silver, /copper, … stubs
├── components/
│   ├── brand/                 # HubMark logos + the hub page header
│   ├── charts/                # TradingView widgets + our own Recharts charts (client)
│   ├── layout/                # Header, footer, nav, theme toggle
│   ├── overview/              # Leaderboard, market cards, driver strip
│   ├── why/                   # One section per driver on /gold/why
│   ├── ui/                    # Small shared pieces: page section, source note
│   ├── providers/             # ThemeProvider (React context)
│   └── ComingSoonStub.tsx
├── content/
│   └── gold.ts                # Editorial text (intro, drivers, geopolitics, sources)
└── lib/
    ├── commodities.ts         # Nav “dimension table”
    ├── format.ts              # Number / price / date formatting
    ├── data/                  # Supabase queries, one file per page
    └── supabase/server.ts     # Read-only Supabase client
```

**Rule of thumb:** pages in `app/` arrange sections; queries live in `lib/data/`; wording lives
in `content/`; reusable visual pieces live in `components/`.

## How URLs map to files

| URL | File |
| --- | --- |
| `/` | `src/app/page.tsx` |
| `/gold` | `src/app/gold/page.tsx` |
| `/gold/why` | `src/app/gold/why/page.tsx` |
| `/gold/physical` | `src/app/gold/physical/page.tsx` |
| `/silver` | `src/app/[commodity]/page.tsx` with `commodity=silver` |

`[commodity]` is a **dynamic segment** (like a path parameter). Gold uses its own folder so `/gold/*` never falls through to the stub.

## Server vs Client Components (short version)

- **Server Component** (default): runs on the server, great for pages that just display data. No `"use client"`.
- **Client Component**: needs `"use client"` at the top when you use clicks, `useState`, `localStorage`, hover menus, etc.

We keep most pages as Server Components and only mark interactive pieces (nav dropdown, theme toggle) as Client Components.

## Path alias `@/`

Imports like `@/lib/commodities` mean “from the `src/` folder”. Configured in `tsconfig.json`.

Next: [03 — Theme and navigation](./03-theme-and-navigation.md)
