import { collectNewsForCompany } from "@/lib/ingestion/collect-news";
import { dedupeByExternalKey } from "@/lib/ingestion/dedupe-news";
import { getRecentSecInsiderTransactions } from "@/lib/integrations/sec-edgar";
import { normalizeSecTransaction } from "@/lib/ingestion/sec-insiders";
import { signalInputToRow, type SignalInput } from "@/lib/ingestion/types";
import { trackedCompanies } from "@/lib/market/companies";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeStockScores, stockScoreToRow } from "@/lib/scoring";

export type RefreshSummary = {
  news: number;
  insiders: number;
  upserted: number;
  scored: number;
  errors: string[];
};

const INSIDER_FILINGS_PER_COMPANY = 3;

async function collectNewsSignals(errors: string[]): Promise<SignalInput[]> {
  const results = await Promise.all(
    trackedCompanies.map(async (company) => {
      try {
        return await collectNewsForCompany({
          company,
          gdeltMaxRecords: 250,
          gdeltTimespan: "7d",
          yahooNewsCount: 50,
          finnhubDaysBack: 14,
          finnhubLimit: 50,
          maxItems: 40
        });
      } catch (error) {
        errors.push(`news:${company.ticker}: ${error instanceof Error ? error.message : "unknown error"}`);
        return [];
      }
    })
  );

  return results.flat();
}

async function collectInsiderSignals(errors: string[]): Promise<SignalInput[]> {
  const results = await Promise.all(
    trackedCompanies.map(async (company) => {
      try {
        const trades = await getRecentSecInsiderTransactions({
          ticker: company.ticker,
          limit: INSIDER_FILINGS_PER_COMPANY
        });
        return trades.map((trade, index) => normalizeSecTransaction(trade, index));
      } catch (error) {
        errors.push(`insider:${company.ticker}: ${error instanceof Error ? error.message : "unknown error"}`);
        return [];
      }
    })
  );

  return results.flat();
}

async function recomputeScoresFromDatabase(errors: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("signals")
    .select("ticker, company_name, direction, signal_type");

  if (error) {
    errors.push(`scores-read: ${error.message}`);
    return 0;
  }

  const scoreRows = computeStockScores(
    (data ?? []).map((signal) => ({
      ticker: signal.ticker,
      companyName: signal.company_name,
      direction: signal.direction,
      signalType: signal.signal_type
    }))
  ).map(stockScoreToRow);

  if (scoreRows.length === 0) {
    return 0;
  }

  const { error: scoreError, count } = await supabase
    .from("stock_scores")
    .upsert(scoreRows, { onConflict: "ticker", count: "exact" });

  if (scoreError) {
    errors.push(`scores: ${scoreError.message}`);
    return 0;
  }

  return count ?? scoreRows.length;
}

export async function refreshSignals(): Promise<RefreshSummary> {
  const errors: string[] = [];
  const [newsSignals, insiderSignals] = await Promise.all([
    collectNewsSignals(errors),
    collectInsiderSignals(errors)
  ]);

  const allSignals = dedupeByExternalKey([...newsSignals, ...insiderSignals]);
  let upserted = 0;
  let scored = 0;

  if (allSignals.length > 0) {
    const supabase = createAdminClient();
    const rows = allSignals.map(signalInputToRow);
    const { error, count } = await supabase
      .from("signals")
      .upsert(rows, { onConflict: "source,external_id", count: "exact" });

    if (error) {
      errors.push(`upsert: ${error.message}`);
    } else {
      upserted = count ?? rows.length;
    }
  }

  scored = await recomputeScoresFromDatabase(errors);

  return {
    news: newsSignals.length,
    insiders: insiderSignals.length,
    upserted,
    scored,
    errors
  };
}
