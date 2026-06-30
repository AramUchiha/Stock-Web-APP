import type { Metadata } from "next";
import Link from "next/link";
import { MarketTabs } from "@/components/MarketTabs";
import { NewsFeedItem } from "@/components/NewsFeedItem";
import { ensureTickerSignals, ensureTrackedNews } from "@/lib/ingestion/on-demand";
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

function getDateKey(value: string | null) {
  if (!value) {
    return "Undated";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Undated" : date.toISOString().slice(0, 10);
}

function formatDateHeading(dateKey: string) {
  if (dateKey === "Undated") {
    return dateKey;
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const date = new Date(`${dateKey}T00:00:00Z`);

  if (dateKey === today.toISOString().slice(0, 10)) {
    return "Today";
  }

  if (dateKey === yesterday.toISOString().slice(0, 10)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const ticker = normalizeTicker(getSingleParam(searchParams?.ticker));

  if (ticker) {
    await ensureTickerSignals(ticker);
  } else {
    await ensureTrackedNews();
  }

  const { signals, lastRefreshed, error } = await readCachedSignals({ signalType: "news", ticker, limit: 100 });
  const groupedSignals = Object.entries(
    signals.reduce<Record<string, typeof signals>>((groups, signal) => {
      const dateKey = getDateKey(signal.source_published_at);
      groups[dateKey] = [...(groups[dateKey] ?? []), signal];
      return groups;
    }, {})
  );

  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
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
          {signals.length > 0 ? (
            groupedSignals.map(([dateKey, dateSignals]) => (
              <div key={dateKey} className="mb-8 last:mb-0">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    {formatDateHeading(dateKey)}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div>
                  {dateSignals.map((signal) => (
                    <NewsFeedItem key={signal.id} signal={signal} />
                  ))}
                </div>
              </div>
            ))
          ) : !error ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-zinc-400">
              No cached news yet{ticker ? <span> for <span className="font-mono text-zinc-200">{ticker}</span></span> : null}. Run the refresh
              job to populate this feed.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
