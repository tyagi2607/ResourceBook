# ResourceBook
A public website for Natural resources analysis

Project Master Requirements & Architecture Document
Project Name: ResourceMarketCap (Commodity Investment Channel & Analytics Dashboard)

Document Purpose: Comprehensive Master Requirements, Architecture Specifications, Tech Stack Decisions, and Operational Workflows.

1. Executive Summary & Core Concept
1.1 The Market Problem
The retail commodity and resource investment sector suffers from fragmented, archaic, and difficult-to-navigate data platforms (e.g., outdated TSX/SEDAR/EDGAR interfaces). Younger, macro-focused investors looking to allocate capital into hard assets (Gold, Silver, Uranium, Copper, Lithium) lack a sleek, modern UI comparable to platforms like CoinMarketCap or CoinGecko.

1.2 The Solution
ResourceMarketCap combines a modern, real-time analytics web dashboard with an integrated content media brand (X/Twitter + Reddit).

                              ┌─────────────────────────────────────────┐
                              │       MEDIA BRAND & AUDIENCE FUNNEL     │
                              │  X/Twitter (Highlights) / Reddit (Deep) │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   RESOURCE MARKET CAP DASHBOARD UI                                     │
│  - Commodity Hubs (Gold, Silver, Uranium, Copper, Lithium)                                             │
│  - Categorization Tiers (Majors/Producers, Developers, Explorers/Juniors, ETFs, Physical Trusts)       │
│  - Key Metrics: Price, Market Cap, AISC ($/oz), P/NAV Ratio, Production Volume, Reserves, Sparklines   │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │      MONETIZATION & VALUE CAPTURE       │
                               │  Sponsorships, Mining Leads, Pro Tools  │
                               └─────────────────────────────────────────┘

2. Platform Architecture & Categorization Schema
2.1 UI Categorization Framework
The dashboard groups assets across two key dimensions: Commodity Type and The Risk/Development Curve.

Commodity Hubs
Precious Metals: Gold, Silver, Platinum Group Metals (PGMs)
Energy Transition & Nuclear: Uranium, Lithium, Copper, Nickel

Asset Tiers (The Risk Curve)
Physical Trusts & Custodial Assets: Sprott Physical Gold Trust (PHYS), Sprott Physical Uranium Trust (SRUUF).

ETFs & Indexes: GDX, GDXJ, URA, SILJ.

Tier 1 Producers / Majors: Free cash flow positive, producing miners (e.g., Barrick, Agnico Eagle, Cameco).

Developers: Near-production assets with completed Feasibility Studies (FS) or Preliminary Economic Assessments (PEA).

Explorers / Juniors: High-risk drill target plays with NI 43-101 / JORC resource estimates.



3. Technology Stack & Tooling Strategy

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND UI LAYER                                        │
│  - Next.js (App Router, TypeScript)                                                     │
│  - Tailwind CSS (Dark Mode Design Tokens)                                               │
│  - Component Design: Prototyped via v0 by Vercel                                        │
│  - Hosting & CI/CD: Vercel                                                              │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE & BACKEND LAYER                                 │
│  - Supabase (PostgreSQL Database, Row-Level Security, Real-time Subscriptions)          │
└───────────────────────────────────────────▲─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            AUTOMATED DATA EXTRACTION PIPELINE                           │
│  - Python 3.11+ Scripts (`/scripts` folder)                                             │
│  - Google Gemini API (Gemini 2.5/3 PDF Vision)                                          │
│  - Pydantic Data Models (Strict JSON Enforcement)                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘


## 3. Technology Stack & Tooling Strategy

### 3.1 Tech Stack Table

| Layer | Selected Tool | Role & Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | Server Components for ultra-fast initial page loads and SEO optimization for stock tickers. |
| **Styling** | **Tailwind CSS** | Utility-first CSS for responsive, dark-mode tables and dashboard cards. |
| **UI Design / Blocks** | **v0 by Vercel** | AI visual generator to output styled React/Tailwind visual UI blocks (tables, cards, sparklines) in seconds. |
| **Hosting & CI/CD** | **Vercel** | Automated continuous deployment directly from GitHub main branch. |
| **Database** | **Supabase (PostgreSQL)** | Relational database to store asset metadata, historical AISC, P/NAV, and price feeds. |
| **IDE / AI Coding** | **Cursor Pro ($20/mo)** | AI-native editor for repo-wide indexing, Plan Mode drafting, multi-file Agent execution, and mobile Cloud Agent directing. |
| **PDF Data Extraction** | **Google Gemini API** | Native multi-page PDF vision processing to parse corporate financial filings (10-Q, 10-K, NI 43-101) into structured data. |
| **Scripting Layer** | **Python 3.11+ & Pydantic** | Execution scripts (`/scripts`) to enforce strict schema validation and write data directly to Supabase. |


---

## 5. Automated Quarterly PDF Extraction Pipeline (Gemini API)

### 5.1 Architecture & Workflow
Quarterly corporate reports (10-Q/10-K, investor presentations, technical reports) are automatically processed without manual data entry


┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ Quarterly Corporate    │ ───► │ Python Script Calls    │ ───► │ Structured JSON Data   │
│ PDF Filings            │      │ Gemini 2.5/3 API       │      │ (AISC, NAV, Reserves)  │
└────────────────────────┘      └────────────────────────┘      └───────────┬────────────┘
                                                                            │
┌────────────────────────┐      ┌────────────────────────┐                  │
│ Next.js Dashboard UI   │ ◄─── │ Supabase Postgres DB   │ ◄────────────────┘
│ Updates Automatically  │      │ Auto-Saves Extracted   │
└────────────────────────┘      └────────────────────────┘


### 5.2 Implementation Code (`scripts/extract_quarterly_data.py`)

```python
import os
from google import genai
from pydantic import BaseModel, Field
from typing import Optional
import supabase

# 1. Define strict Pydantic schema for extracted mining metrics
class MiningQuarterlyMetrics(BaseModel):
    company_ticker: str = Field(description="Stock ticker, e.g., GOLD, AEM, CCJ")
    reporting_period: str = Field(description="Quarter and Year, e.g., Q2 2026")
    aisc_per_ounce: Optional[float] = Field(description="All-In Sustaining Cost in USD per ounce")
    gold_production_oz: Optional[float] = Field(description="Total gold produced in ounces")
    nav_per_share: Optional[float] = Field(description="Net Asset Value per share in USD")
    proven_probable_reserves_oz: Optional[float] = Field(description="Total P&P reserves in million oz")
    free_cash_flow_usd_millions: Optional[float] = Field(description="Free Cash Flow in USD millions")

# 2. Initialize clients
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
sb_client = supabase.create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def process_quarterly_report(pdf_file_path: str):
    # Upload PDF directly to Gemini API
    pdf_file = gemini_client.files.upload(file=pdf_file_path)
    
    # Prompt Gemini to extract fields matching the Pydantic schema
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            pdf_file,
            "Extract all quarterly financial figures, AISC ($/oz), production numbers, and NAV per share."
        ],
        config={
            'response_mime_type': 'application/json',
            'response_schema': MiningQuarterlyMetrics
        }
    )
    
    extracted_data = response.parsed
    
    # Insert structured data directly into Supabase database
    sb_client.table('quarterly_metrics').insert(extracted_data.dict()).execute()
    print(f"Successfully processed {extracted_data.company_ticker} for {extracted_data.reporting_period}")
```


6. Cursor Project Rules (.cursorrules)
Create a .cursorrules file at the root of the repository to enforce guidelines across all Cursor Agent runs:

Markdown
# ResourceMarketCap Project Rules

## Technical Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React icons.
- Backend / Database: Supabase (PostgreSQL).
- Data Extraction: Python 3.11+, typed with Pydantic, using `google-genai` SDK.

## UI & Design Guidelines
- Default Theme: Dark mode (`bg-slate-900`, `text-slate-100`, slate border accents).
- Color Highlights: Gold accents (`text-amber-400`, `border-amber-500/20`) for precious metals; Green accents (`text-emerald-400`) for gains/positive cash flow.
- Components: Fully responsive, accessible, clean modular design. No inline styles.

## Code Conventions
- Next.js Server Components by default; use 'use client' only when interaction or state management is required.
- Enforce strict typing in TypeScript interfaces and Python Pydantic models.

7. Media Strategy & Monetization Roadmap

┌─────────────────────────────────────────────────────────────────────────┐
│                          AUDIENCE ACQUISITION                           │
│  - X / Twitter: Daily macro commentary, ticker infographics, AISC charts │
│  - Reddit (r/Commodities, r/Gold, r/UraniumSqueeze): Deep NI 43-101 post│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD TRAFFIC & CONVERSION                      │
│  - Free Public Dashboard: Ticker tracking, P/NAV rankings, Sprott NAV   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MONETIZATION TIERS                            │
│  - Tier 1: Sponsored Company Profiles & Verified Explorer Badges        │
│  - Tier 2: Affiliate & Lead Generation for Physical Trusts / Brokers    │
│  - Tier 3: Pro Subscription (Custom Screener, Gemini AI Alerts, API)    │
└─────────────────────────────────────────────────────────────────────────┘

8. Immediate Implementation Checklist

