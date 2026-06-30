import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveQuote } from "@/components/LiveQuote";
import { NewsFeedItem } from "@/components/NewsFeedItem";
import { StockChart } from "@/components/StockChart";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { ensureTickerSignals } from "@/lib/ingestion/on-demand";
import { readCachedSignals } from "@/lib/ingestion/read-signals";
import { formatCompact, formatCurrency, formatDateTime, formatPrice, normalizeTicker } from "@/lib/format";

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

export default async function StockPage({ params }: StockPageProps) {
  const ticker = normalizeTicker(params.ticker);

  if (!ticker) {
    notFound();
  }

  const provider = getMarketDataProvider();
  const [quote, profile] = await Promise.all([
    provider.getQuote(ticker).catch(() => null),
    provider.getProfile(ticker).catch(() => null)
  ]);

  if (!quote) {
    notFound();
  }

  const name = quote.name ?? profile?.name ?? ticker;

  await ensureTickerSignals(ticker, name);

  const [news, insiders] = await Promise.all([
    readCachedSignals({ signalType: "news", ticker, limit: 40 }),
    readCachedSignals({ signalType: "insider", ticker, limit: 20 })
  ]);

  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
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
            {profile?.sector ? (
              <p className="mt-2 text-sm text-zinc-400">
                {profile.sector}
                {profile.industry ? ` \u00b7 ${profile.industry}` : ""}
              </p>
            ) : null}
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

        {profile?.description ? (
          <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">About</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{profile.description}</p>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Recent news</h2>
          {news.signals.length > 0 ? (
            <div className="mt-4">
              {news.signals.map((signal) => (
                <NewsFeedItem key={signal.id} signal={signal} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
              No cached news yet for {quote.ticker}.
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Insider filings</h2>
          {insiders.signals.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {insiders.signals.map((signal) => (
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
          ) : (
            <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
              No cached insider filings yet for {quote.ticker}.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
