import { extractStockMove } from "@/lib/format";
import type { SignalDirection } from "@/lib/ingestion/types";

const BULLISH_KEYWORDS = [
  "surge",
  "surges",
  "soar",
  "soars",
  "rally",
  "rallies",
  "jump",
  "jumps",
  "gain",
  "gains",
  "rise",
  "rises",
  "beat",
  "beats",
  "upgrade",
  "upgraded",
  "record high",
  "profit",
  "growth",
  "bullish",
  "outperform"
];

const BEARISH_KEYWORDS = [
  "drop",
  "drops",
  "fall",
  "falls",
  "fell",
  "decline",
  "declines",
  "plunge",
  "plunges",
  "slump",
  "slumps",
  "miss",
  "misses",
  "cut",
  "cuts",
  "downgrade",
  "downgraded",
  "loss",
  "losses",
  "layoff",
  "layoffs",
  "bearish",
  "underperform",
  "warning",
  "warns"
];

export function inferNewsDirection(title: string): SignalDirection {
  const move = extractStockMove(title);

  if (move?.direction === "up") {
    return "bullish";
  }

  if (move?.direction === "down") {
    return "bearish";
  }

  const lower = title.toLowerCase();
  const bullishHits = BULLISH_KEYWORDS.filter((word) => lower.includes(word)).length;
  const bearishHits = BEARISH_KEYWORDS.filter((word) => lower.includes(word)).length;

  if (bullishHits > bearishHits) {
    return "bullish";
  }

  if (bearishHits > bullishHits) {
    return "bearish";
  }

  return "neutral";
}
