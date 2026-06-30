import type { SecInsiderTransaction } from "@/lib/integrations/sec-edgar";
import type { Json } from "@/lib/database.types";
import type { SignalDirection, SignalInput } from "@/lib/ingestion/types";

function getDirection(code: string | undefined): SignalDirection {
  if (code?.toUpperCase() === "A") {
    return "bullish";
  }

  if (code?.toUpperCase() === "D") {
    return "bearish";
  }

  return "neutral";
}

function getActionWord(code: string | undefined) {
  if (code?.toUpperCase() === "A") {
    return "acquired";
  }

  if (code?.toUpperCase() === "D") {
    return "disposed of";
  }

  return "filed for";
}

function buildDescription(trade: SecInsiderTransaction) {
  const owner = trade.ownerName ?? "Reporting owner";
  const action = getActionWord(trade.acquiredDisposedCode);

  if (typeof trade.shares === "number") {
    const shares = new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(trade.shares);
    return `${owner} ${action} ${shares} shares of ${trade.ticker}.`;
  }

  return `${owner} ${action} shares of ${trade.ticker}.`;
}

export function normalizeSecTransaction(trade: SecInsiderTransaction, index: number): SignalInput {
  const dollarAmount =
    typeof trade.shares === "number" && typeof trade.pricePerShare === "number"
      ? trade.shares * trade.pricePerShare
      : undefined;

  return {
    ticker: trade.ticker,
    companyName: trade.companyName,
    signalType: "insider",
    direction: getDirection(trade.acquiredDisposedCode),
    source: "sec_edgar",
    actor: trade.ownerName,
    dollarAmount,
    description: buildDescription(trade),
    signalDate: trade.transactionDate ?? trade.filingDate,
    rawUrl: trade.filingUrl,
    externalId: `${trade.accessionNumber}:${index}`,
    sourcePublishedAt: trade.filedAt ?? `${trade.filingDate}T00:00:00Z`,
    rawPayload: trade as unknown as Json
  };
}
