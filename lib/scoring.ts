import type { Database } from "@/lib/database.types";

export type ScorableSignal = {
  ticker: string;
  companyName?: string | null;
  direction: string;
  signalType: string;
};

export type StockScore = {
  ticker: string;
  companyName?: string;
  bullishScore: number;
  bearishScore: number;
  signalCount: number;
  topSignals: string[];
  direction: "bullish" | "bearish";
};

type StockScoreRow = Database["public"]["Tables"]["stock_scores"]["Insert"];

export function computeStockScores(signals: ScorableSignal[]): StockScore[] {
  const byTicker = new Map<string, ScorableSignal[]>();

  for (const signal of signals) {
    const ticker = signal.ticker.toUpperCase();
    byTicker.set(ticker, [...(byTicker.get(ticker) ?? []), signal]);
  }

  const scores: StockScore[] = [];

  for (const [ticker, tickerSignals] of byTicker) {
    const bullishCount = tickerSignals.filter((signal) => signal.direction === "bullish").length;
    const bearishCount = tickerSignals.filter((signal) => signal.direction === "bearish").length;
    const directional = bullishCount + bearishCount;

    const bullishScore = directional > 0 ? Math.round((bullishCount / directional) * 100) : 50;
    const bearishScore = 100 - bullishScore;

    const topSignals = Array.from(new Set(tickerSignals.map((signal) => signal.signalType)));
    const companyName = tickerSignals.find((signal) => signal.companyName)?.companyName ?? undefined;

    scores.push({
      ticker,
      companyName,
      bullishScore,
      bearishScore,
      signalCount: tickerSignals.length,
      topSignals,
      direction: bullishScore >= bearishScore ? "bullish" : "bearish"
    });
  }

  return scores;
}

export function stockScoreToRow(score: StockScore): StockScoreRow {
  return {
    ticker: score.ticker,
    company_name: score.companyName ?? null,
    bullish_score: score.bullishScore,
    bearish_score: score.bearishScore,
    signal_count: score.signalCount,
    top_signals: score.topSignals,
    last_refreshed: new Date().toISOString()
  };
}
