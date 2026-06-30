import type { Database, Json } from "@/lib/database.types";

export type SignalDirection = "bullish" | "bearish" | "neutral";

export type SignalInput = {
  ticker: string;
  companyName?: string;
  signalType: "insider" | "political" | "contract" | "news" | "social" | "regulatory" | "lobbying";
  direction: SignalDirection;
  source: string;
  actor?: string;
  dollarAmount?: number;
  description?: string;
  signalDate?: string;
  rawUrl?: string;
  externalId: string;
  sourcePublishedAt?: string;
  rawPayload?: Json;
};

type SignalRow = Database["public"]["Tables"]["signals"]["Insert"];

export function signalInputToRow(input: SignalInput): SignalRow {
  return {
    ticker: input.ticker,
    company_name: input.companyName ?? null,
    signal_type: input.signalType,
    direction: input.direction,
    source: input.source,
    actor: input.actor ?? null,
    dollar_amount: input.dollarAmount ?? null,
    description: input.description ?? null,
    signal_date: input.signalDate ?? null,
    raw_url: input.rawUrl ?? null,
    external_id: input.externalId,
    source_published_at: input.sourcePublishedAt ?? null,
    raw_payload: input.rawPayload ?? null
  };
}
