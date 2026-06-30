import type { Metadata } from "next";
import { MarketTabs } from "@/components/MarketTabs";
import { StockCard } from "@/components/StockCard";
import { SymbolSearch } from "@/components/SymbolSearch";
import { readStockScores, type StockScoreRow } from "@/lib/ingestion/read-scores";
import { demoStockSignals, type DemoStockSignal } from "@/lib/seed-data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard | StockSignal"
};

export const dynamic = "force-dynamic";

function toSignalTypes(topSignals: StockScoreRow["top_signals"]): string[] {
  if (!Array.isArray(topSignals)) {
    return [];
  }

  return topSignals.filter((value): value is string => typeof value === "string");
}

function scoreToCard(score: StockScoreRow): DemoStockSignal {
  const bullish = score.bullish_score ?? 0;
  const bearish = score.bearish_score ?? 0;
  const direction = bullish >= bearish ? "bullish" : "bearish";

  return {
    ticker: score.ticker,
    companyName: score.company_name ?? score.ticker,
    score: direction === "bullish" ? bullish : bearish,
    direction,
    signals: toSignalTypes(score.top_signals),
    updatedAt: formatDateTime(score.last_refreshed)
  };
}

function SignalColumn({ title, signals }: { title: string; signals: DemoStockSignal[] }) {
  if (signals.length === 0) {
    return (
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">{title}</h2>
        <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
          No signals yet. Run the refresh job to populate scores.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {signals.map((signal) => (
          <StockCard
            key={signal.ticker}
            ticker={signal.ticker}
            companyName={signal.companyName}
            score={signal.score}
            direction={signal.direction}
            signals={signal.signals}
            updatedAt={signal.updatedAt}
          />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { scores } = await readStockScores(40);
  const cards = scores.length > 0 ? scores.map(scoreToCard) : demoStockSignals;

  const bullishSignals = cards.filter((signal) => signal.direction === "bullish");
  const bearishSignals = cards.filter((signal) => signal.direction === "bearish");
  const usingDemoData = scores.length === 0;

  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-bullish">Signal overview</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Bullish and bearish signal monitoring across tracked companies. Source data for informational purposes only.
            </p>
            <div className="mt-5">
              <SymbolSearch />
            </div>
          </div>
          <MarketTabs active="news" />
        </div>

        {usingDemoData ? (
          <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-zinc-500">
            Showing sample data. Run the refresh job to populate live scores.
          </p>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <SignalColumn title="Bullish signals" signals={bullishSignals} />
          <SignalColumn title="Bearish signals" signals={bearishSignals} />
        </div>
      </div>
    </main>
  );
}
