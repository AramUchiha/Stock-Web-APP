import { collectNewsForCompany } from "@/lib/ingestion/collect-news";
import { getInsiderTransactionsForTicker, resolveCompany } from "@/lib/integrations/sec-edgar";
import { normalizeSecTransaction } from "@/lib/ingestion/sec-insiders";
import { signalInputToRow } from "@/lib/ingestion/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackedCompanies, type TrackedCompany } from "@/lib/market/companies";

const FRESH_TTL_MS = 15 * 60 * 1000;
const INSIDER_LIMIT = 8;

type AdminClient = ReturnType<typeof createAdminClient>;

function isFreshTimestamp(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return Date.now() - new Date(value).getTime() < FRESH_TTL_MS;
}

async function needsNewsRefresh(supabase: AdminClient, ticker: string) {
  const { data, error } = await supabase
    .from("signals")
    .select("source, created_at")
    .eq("ticker", ticker)
    .eq("signal_type", "news");

  if (error || !data || data.length === 0) {
    return true;
  }

  const recent = data.filter((row) => isFreshTimestamp(row.created_at));
  const recentSources = new Set(recent.map((row) => row.source).filter(Boolean));

  if (!recentSources.has("yahoo_finance_news")) {
    return true;
  }

  return recent.length === 0;
}

async function needsInsiderRefresh(supabase: AdminClient, ticker: string) {
  const { data, error } = await supabase
    .from("signals")
    .select("created_at")
    .eq("ticker", ticker)
    .eq("signal_type", "insider")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return true;
  }

  return !isFreshTimestamp(data[0].created_at);
}

async function collectInsiders(ticker: string) {
  const trades = await getInsiderTransactionsForTicker(ticker, INSIDER_LIMIT);
  return trades.map((trade, index) => normalizeSecTransaction(trade, index));
}

export async function ensureTickerSignals(ticker: string, companyName?: string): Promise<void> {
  const upper = ticker.toUpperCase();

  try {
    const supabase = createAdminClient();
    const resolved = await resolveCompany(upper).catch(() => null);
    const company: TrackedCompany = resolved ?? {
      ticker: upper,
      companyName: companyName ?? upper,
      cik: "",
      searchTerms: [companyName ?? upper, upper]
    };

    const [shouldRefreshNews, shouldRefreshInsiders] = await Promise.all([
      needsNewsRefresh(supabase, upper),
      company.cik ? needsInsiderRefresh(supabase, upper) : Promise.resolve(false)
    ]);

    if (!shouldRefreshNews && !shouldRefreshInsiders) {
      return;
    }

    const [newsSignals, insiderSignals] = await Promise.all([
      shouldRefreshNews
        ? collectNewsForCompany({
            company,
            gdeltMaxRecords: 250,
            gdeltTimespan: "14d",
            yahooNewsCount: 50,
            finnhubDaysBack: 14,
            finnhubLimit: 50,
            maxItems: 80
          }).catch(() => [])
        : Promise.resolve([]),
      shouldRefreshInsiders ? collectInsiders(upper).catch(() => []) : Promise.resolve([])
    ]);

    const rows = [...newsSignals, ...insiderSignals].map(signalInputToRow);

    if (rows.length === 0) {
      return;
    }

    await supabase.from("signals").upsert(rows, { onConflict: "source,external_id" });
  } catch {
    // On-demand enrichment is best-effort; the page still renders cached data.
  }
}

export async function ensureTrackedNews(): Promise<void> {
  await Promise.all(
    trackedCompanies.map((company) => ensureTickerSignals(company.ticker, company.companyName))
  );
}
