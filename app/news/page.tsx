import type { Metadata } from "next";
import Link from "next/link";
import { MarketTabs } from "@/components/MarketTabs";
import { NewsFeed } from "@/components/NewsFeed";
import { SignalSync } from "@/components/SignalSync";
import { readCachedSignals } from "@/lib/ingestion/read-signals";
import { trackedCompanies } from "@/lib/market/companies";
import { formatDateTime, getSingleParam, normalizeTicker } from "@/lib/format";

export const metadata: Metadata = {
  title: "News | StockSignal"
};

export const dynamic = "force-dynamic";

type NewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const categories = ["All News", "Stock Moves", "Contracts", "Congress", "Funds", "Government", "Insiders", "Lobbying", "Press Releases"];

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const ticker = normalizeTicker(getSingleParam(searchParams?.ticker));
  const companyName = ticker ? trackedCompanies.find((company) => company.ticker === ticker)?.companyName : undefined;

  const { signals, lastRefreshed, error } = await readCachedSignals({ signalType: "news", ticker, limit: 100 });

  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      {ticker ? <SignalSync ticker={ticker} companyName={companyName} /> : null}
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 pb-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">News</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
              The latest market headlines and public-source signal context for tracked companies.
            </p>
            <p className="mt-2 text-xs text-zinc-500">Last refreshed {formatDateTime(lastRefreshed)}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Link href="/settings" className="text-sm font-medium text-bullish hover:text-emerald-300">
              + News Alerts
            </Link>
            <MarketTabs active="news" />
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto border-b border-border pb-4 text-sm text-zinc-500">
          {categories.map((category, index) => (
            <Link
              key={category}
              href="/news"
              className={`shrink-0 transition-colors hover:text-white ${index === 0 ? "font-medium text-white" : ""}`}
            >
              {category}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/news"
            className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
              ticker ? "border-border text-zinc-300 hover:border-zinc-700 hover:text-white" : "border-bullish/40 bg-bullish/10 text-bullish"
            }`}
          >
            ALL
          </Link>
          {trackedCompanies.map((company) => (
            <Link
              key={company.ticker}
              href={`/news?ticker=${company.ticker}`}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
                ticker === company.ticker
                  ? "border-bullish/40 bg-bullish/10 text-bullish"
                  : "border-border text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {company.ticker}
            </Link>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-bearish/30 bg-bearish/10 p-5 text-sm text-red-200">{error}</div>
        ) : null}

        <section className="mt-7">
          {!error ? <NewsFeed signals={signals} ticker={ticker} /> : null}
        </section>
      </div>
    </main>
  );
}
