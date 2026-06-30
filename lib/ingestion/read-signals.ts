import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { dedupeNewsSignals } from "@/lib/ingestion/dedupe-news";
import type { SignalInput } from "@/lib/ingestion/types";

export type SignalRow = Database["public"]["Tables"]["signals"]["Row"];

type ReadSignalsOptions = {
  signalType: "news" | "insider";
  ticker?: string;
  limit?: number;
};

export type ReadSignalsResult = {
  signals: SignalRow[];
  lastRefreshed: string | null;
  error: string | null;
};

function rowToSignalInput(row: SignalRow): SignalInput {
  return {
    ticker: row.ticker,
    companyName: row.company_name ?? undefined,
    signalType: row.signal_type as SignalInput["signalType"],
    direction: row.direction as SignalInput["direction"],
    source: row.source ?? "unknown",
    actor: row.actor ?? undefined,
    dollarAmount: row.dollar_amount ?? undefined,
    description: row.description ?? undefined,
    signalDate: row.signal_date ?? undefined,
    rawUrl: row.raw_url ?? undefined,
    externalId: row.external_id ?? row.id,
    sourcePublishedAt: row.source_published_at ?? undefined,
    rawPayload: row.raw_payload ?? undefined
  };
}

function dedupeNewsRows(rows: SignalRow[], limit: number) {
  const rowByKey = new Map(rows.map((row) => [`${row.source ?? "unknown"}:${row.external_id ?? row.id}`, row]));
  const deduped = dedupeNewsSignals(rows.map(rowToSignalInput), limit);

  return deduped
    .map((signal) => rowByKey.get(`${signal.source}:${signal.externalId}`))
    .filter((row): row is SignalRow => row !== undefined);
}

export async function readCachedSignals({ signalType, ticker, limit = 30 }: ReadSignalsOptions): Promise<ReadSignalsResult> {
  try {
    const supabase = createClient();
    const fetchLimit = signalType === "news" ? Math.max(limit * 3, 120) : limit;

    let query = supabase
      .from("signals")
      .select("*")
      .eq("signal_type", signalType)
      .order("source_published_at", { ascending: false, nullsFirst: false })
      .limit(fetchLimit);

    if (ticker) {
      query = query.eq("ticker", ticker);
    }

    const { data, error } = await query;

    if (error) {
      return { signals: [], lastRefreshed: null, error: error.message };
    }

    const rawSignals = data ?? [];
    const signals =
      signalType === "news" ? dedupeNewsRows(rawSignals, limit) : rawSignals.slice(0, limit);

    const lastRefreshed = signals.reduce<string | null>((latest, signal) => {
      const candidate = signal.created_at;
      if (candidate && (!latest || candidate > latest)) {
        return candidate;
      }
      return latest;
    }, null);

    return { signals, lastRefreshed, error: null };
  } catch (error) {
    return {
      signals: [],
      lastRefreshed: null,
      error: error instanceof Error ? error.message : "Unable to read cached signals."
    };
  }
}
