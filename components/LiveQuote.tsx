"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/integrations/market-data/types";
import { formatPrice, formatSignedPercent, formatSignedPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type LiveQuoteProps = {
  ticker: string;
  initialQuote: Quote;
  pollMs?: number;
};

export function LiveQuote({ ticker, initialQuote, pollMs = 30_000 }: LiveQuoteProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const response = await fetch(`/api/market/quote?ticker=${encodeURIComponent(ticker)}`);
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as Quote;
        if (active) {
          setQuote(data);
        }
      } catch {
        // ignore transient polling errors; keep last known quote
      }
    }

    const interval = setInterval(poll, pollMs);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [ticker, pollMs]);

  const isUp = quote.change >= 0;

  return (
    <div>
      <p className="font-mono text-4xl font-bold text-white sm:text-5xl">{formatPrice(quote.price, quote.currency)}</p>
      <p className={cn("mt-2 font-mono text-sm font-semibold", isUp ? "text-bullish" : "text-bearish")}>
        {formatSignedPrice(quote.change)} ({formatSignedPercent(quote.percentChange)})
      </p>
      {quote.marketState ? (
        <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{quote.marketState}</p>
      ) : null}
    </div>
  );
}
