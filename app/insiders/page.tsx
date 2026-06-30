import type { Metadata } from "next";
import Link from "next/link";
import { MarketTabs } from "@/components/MarketTabs";
import { readCachedSignals } from "@/lib/ingestion/read-signals";
import { trackedCompanies } from "@/lib/market/companies";
import { formatCurrency, formatDateTime, getSingleParam, normalizeTicker } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Insider Filings | StockSignal"
};

export const dynamic = "force-dynamic";

type InsidersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getActionLabel(direction: string) {
  if (direction === "bullish") {
    return "Acquired";
  }

  if (direction === "bearish") {
    return "Disposed";
  }

  return "Filed";
}

function getActionClass(direction: string) {
  if (direction === "bullish") {
    return "border-bullish/30 bg-bullish/10 text-bullish";
  }

  if (direction === "bearish") {
    return "border-bearish/30 bg-bearish/10 text-bearish";
  }

  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
}

export default async function InsidersPage({ searchParams }: InsidersPageProps) {
  const ticker = normalizeTicker(getSingleParam(searchParams?.ticker));
  const { signals, lastRefreshed, error } = await readCachedSignals({ signalType: "insider", ticker, limit: 40 });

  return (
    <main className="flex-1 px-6 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-bullish">Cached feed</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Insider Filings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Recent Form 4 ownership filings for tracked companies, refreshed on a schedule and served from the database. Source data
              for signal monitoring, not guidance.
            </p>
            <p className="mt-2 text-xs text-zinc-500">Last refreshed {formatDateTime(lastRefreshed)}</p>
          </div>
          <MarketTabs active="insiders" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/insiders"
            className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
              ticker ? "border-border text-zinc-300 hover:border-zinc-700 hover:text-white" : "border-bullish/40 bg-bullish/10 text-bullish"
            }`}
          >
            ALL
          </Link>
          {trackedCompanies.map((company) => (
            <Link
              key={company.ticker}
              href={`/insiders?ticker=${company.ticker}`}
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-zinc-950/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Filed</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {signals.map((signal) => (
                  <tr key={signal.id} className="text-zinc-300">
                    <td className="px-4 py-4 font-mono font-bold text-white">{signal.ticker}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{signal.actor ?? "Reporting owner"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{signal.company_name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", getActionClass(signal.direction))}>
                        {getActionLabel(signal.direction)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{formatCurrency(signal.dollar_amount)}</td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-500">{formatDateTime(signal.source_published_at)}</td>
                    <td className="px-4 py-4">
                      {signal.raw_url ? (
                        <a href={signal.raw_url} className="text-bullish hover:text-emerald-300">
                          SEC filing
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {signals.map((signal) => (
              <article key={signal.id} className="rounded-xl border border-border bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-lg font-bold text-white">{signal.ticker}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-200">{signal.actor ?? "Reporting owner"}</p>
                    <p className="mt-1 text-xs text-zinc-500">{signal.company_name}</p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", getActionClass(signal.direction))}>
                    {getActionLabel(signal.direction)}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-zinc-500">Value</dt>
                    <dd className="mt-1 font-mono text-zinc-200">{formatCurrency(signal.dollar_amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Filed</dt>
                    <dd className="mt-1 font-mono text-zinc-200">{formatDateTime(signal.source_published_at)}</dd>
                  </div>
                </dl>
                {signal.raw_url ? (
                  <a href={signal.raw_url} className="mt-4 inline-flex text-sm font-medium text-bullish hover:text-emerald-300">
                    View SEC filing
                  </a>
                ) : null}
              </article>
            ))}
          </div>

          {signals.length === 0 && !error ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              No cached insider filings yet{ticker ? <span> for <span className="font-mono text-zinc-200">{ticker}</span></span> : null}. Run
              the refresh job to populate this feed.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
