import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompanyAbout, CompanySector } from "@/components/CompanyProfile";
import { LiveQuote } from "@/components/LiveQuote";
import { NewsFeedItem } from "@/components/NewsFeedItem";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { Skeleton } from "@/components/Skeleton";
import { SignalSync } from "@/components/SignalSync";
import { StockChart } from "@/components/StockChart";
import { readOutlook } from "@/lib/ai/read-outlook";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { readCachedSignals } from "@/lib/ingestion/read-signals";
import { cached } from "@/lib/cache";
import { formatCompact, formatCurrency, formatDateTime, formatPrice, normalizeTicker } from "@/lib/format";

const QUOTE_TTL_MS = 30_000;

export const dynamic = "force-dynamic";

type StockPageProps = {
  params: { ticker: string };
};

export function generateMetadata({ params }: StockPageProps): Metadata {
  const ticker = normalizeTicker(params.ticker);
  return {
    title: ticker ? `${ticker} | StockSignal` : "Stock | StockSignal"
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-200">{value}</dd>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

async function AIOutlookSection({ ticker }: { ticker: string }) {
  const { outlook } = await readOutlook(ticker);

  if (!outlook) {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
        Generating an AI outlook for {ticker}. Check back in a moment.
      </p>
    );
  }

  const confidenceLabel = outlook.confidence
    ? `${outlook.confidence.charAt(0).toUpperCase()}${outlook.confidence.slice(1)} confidence`
    : null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-bullish">Probability up</span>
            <span className="font-mono text-lg font-semibold text-white">{outlook.probability_up}%</span>
          </div>
          <div className="mt-2">
            <ProbabilityBar score={outlook.probability_up} direction="bullish" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-bearish">Probability down</span>
            <span className="font-mono text-lg font-semibold text-white">{outlook.probability_down}%</span>
          </div>
          <div className="mt-2">
            <ProbabilityBar score={outlook.probability_down} direction="bearish" />
          </div>
        </div>
      </div>

      {outlook.rationale ? <p className="mt-5 text-sm text-zinc-300">{outlook.rationale}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        {confidenceLabel ? <span>{confidenceLabel}</span> : null}
        <span>Updated {formatDateTime(outlook.generated_at)}</span>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        AI-generated estimate from recent price action and signals — not financial advice.
      </p>
    </div>
  );
}

async function NewsSection({ ticker }: { ticker: string }) {
  const { signals } = await readCachedSignals({ signalType: "news", ticker, limit: 40 });

  if (signals.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
        No cached news yet for {ticker}.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {signals.map((signal) => (
        <NewsFeedItem key={signal.id} signal={signal} />
      ))}
    </div>
  );
}

async function InsiderSection({ ticker }: { ticker: string }) {
  const { signals } = await readCachedSignals({ signalType: "insider", ticker, limit: 20 });

  if (signals.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
        No cached insider filings yet for {ticker}.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {signals.map((signal) => (
        <article key={signal.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">{signal.actor ?? "Reporting owner"}</p>
              <p className="mt-1 text-xs text-zinc-500">{signal.description}</p>
            </div>
            <p className="shrink-0 font-mono text-sm text-zinc-200">{formatCurrency(signal.dollar_amount)}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{formatDateTime(signal.source_published_at)}</span>
            {signal.raw_url ? (
              <a href={signal.raw_url} className="text-bullish hover:text-emerald-300">
                SEC filing
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function StockPage({ params }: StockPageProps) {
  const ticker = normalizeTicker(params.ticker);

  if (!ticker) {
    notFound();
  }

  const provider = getMarketDataProvider();
  const quote = await cached(`stock-quote:${ticker}`, QUOTE_TTL_MS, () => provider.getQuote(ticker)).catch(() => null);

  if (!quote) {
    notFound();
  }

  const name = quote.name ?? ticker;

  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <SignalSync ticker={ticker} companyName={name} />
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white">
          &larr; Back to dashboard
        </Link>

        <div className="mt-5 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-md border border-bullish/30 bg-bullish/10 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-bullish">
                {quote.ticker}
              </span>
              {quote.exchange ? <span className="text-xs text-zinc-500">{quote.exchange}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{name}</h1>
            <CompanySector ticker={ticker} />
          </div>
          <LiveQuote ticker={quote.ticker} initialQuote={quote} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Previous close" value={formatPrice(quote.previousClose, quote.currency)} />
          <Stat
            label="Day range"
            value={
              typeof quote.dayLow === "number" && typeof quote.dayHigh === "number"
                ? `${formatPrice(quote.dayLow, quote.currency)} - ${formatPrice(quote.dayHigh, quote.currency)}`
                : "-"
            }
          />
          <Stat label="Volume" value={formatCompact(quote.volume)} />
          <Stat label="Last update" value={formatDateTime(quote.marketTime)} />
        </dl>

        <section className="mt-8">
          <StockChart ticker={quote.ticker} initialRange="1M" />
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">AI outlook</h2>
          <Suspense fallback={<SectionSkeleton />}>
            <AIOutlookSection ticker={ticker} />
          </Suspense>
        </section>

        <CompanyAbout ticker={ticker} />

        <section className="mt-10">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Recent news</h2>
          <Suspense fallback={<SectionSkeleton />}>
            <NewsSection ticker={ticker} />
          </Suspense>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Insider filings</h2>
          <Suspense fallback={<SectionSkeleton />}>
            <InsiderSection ticker={ticker} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
