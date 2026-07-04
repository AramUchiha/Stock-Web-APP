# StockSignal

StockSignal is a full-stack market intelligence dashboard that helps users research public companies through live market data, recent news, insider activity, and AI-generated outlooks. The app is designed to make noisy financial information easier to scan by combining price action, cached signals, and concise probability summaries in one responsive interface.

This project was built as a modern SaaS-style stock research product with an emphasis on speed, clean data flows, and practical user experience.

## What It Does

- Search and view stock detail pages for public companies.
- Display live quote data, price movement, volume, and interactive historical charts.
- Aggregate recent company news from market data sources.
- Track insider filing signals from SEC data.
- Generate cached AI outlooks that estimate the probability of a stock moving up or down over the next 1-2 weeks using recent price action and stored signals.
- Provide dashboard, news, insiders, authentication, and settings pages with a responsive UI.

## Why It Matters

Investors often need to jump between quote pages, news feeds, SEC filings, and analyst commentary. StockSignal brings those signals into one product experience and prioritizes fast page loads by caching data, streaming slower sections, and refreshing expensive work in the background.

The AI outlook feature is intentionally designed to be explainable and cost-aware: it summarizes recent candles and cached signals before calling Claude, stores the result in Supabase, and reuses the cached outlook until it becomes stale.

## Tech Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes and server components
- **Database/Auth:** Supabase with typed database access and row-level security
- **Market Data:** Yahoo Finance and Finnhub integrations
- **Filings/Data Ingestion:** SEC EDGAR and news ingestion pipelines
- **AI:** Anthropic Claude with Zod-validated structured output
- **Charts:** Lightweight Charts
- **Payments Scaffolding:** Stripe-ready subscription fields and dependencies

## Engineering Highlights

- **Performance-first routing:** public stock pages avoid unnecessary auth middleware and defer slow external calls.
- **Background refresh pattern:** signal and AI prediction refreshes run after the page renders, then update cached data.
- **Structured AI outputs:** Claude responses are validated with Zod before being stored or displayed.
- **Typed data layer:** Supabase table types are maintained in `lib/database.types.ts`.
- **Separation of concerns:** raw integrations live under `lib/integrations`, while ingestion and normalization logic lives under `lib/ingestion`.
- **Responsive UI:** pages and components are built to work across desktop and mobile layouts.

## Key Features

### Stock Research Pages

Each stock page includes quote data, an interactive chart, company profile details, recent news, insider filings, and a cached AI outlook. Slow sections use loading states and streaming so navigation feels responsive.

### AI Outlook

The AI outlook system reviews recent price history and cached news/insider signals, then generates:

- Probability the stock moves up
- Probability the stock moves down
- Confidence level
- Short rationale
- Generated timestamp

The result is cached by ticker to avoid repeated LLM calls on every page view.

### Signal Ingestion

The app normalizes data from multiple sources into a common signal format, making it easier to rank and display news and insider activity consistently.

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` using `.env.local.example` as the template, then add your Supabase, Anthropic, market data, and optional Stripe values.

Run checks:

```bash
npm run typecheck
npm run lint
```

## Environment Variables

Required for core app behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `MARKET_DATA_PROVIDER`

Required for AI outlook generation:

- `ANTHROPIC_API_KEY`

Optional or feature-specific:

- `FINNHUB_API_KEY`
- `SEC_USER_AGENT`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRO_PRICE_ID`

## Disclaimer

StockSignal is an educational and research tool. Market signals and AI-generated outlooks are for informational purposes only and are not financial advice.
