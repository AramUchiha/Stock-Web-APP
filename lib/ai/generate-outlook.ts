import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import type { Candle } from "@/lib/integrations/market-data/types";
import { readCachedSignals } from "@/lib/ingestion/read-signals";
import { createAdminClient } from "@/lib/supabase/admin";

export const OUTLOOK_MODEL = "claude-opus-4-8";

const DAY_SECONDS = 24 * 60 * 60;

const OutlookSchema = z.object({
  probabilityUp: z.number().min(0).max(100),
  probabilityDown: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  rationale: z.string()
});

type ParsedOutlook = z.infer<typeof OutlookSchema>;

export type AiOutlook = {
  ticker: string;
  probabilityUp: number;
  probabilityDown: number;
  confidence: "low" | "medium" | "high";
  rationale: string;
  model: string;
};

function pctChangeOverDays(candles: Candle[], days: number): number | null {
  if (candles.length < 2) {
    return null;
  }

  const latest = candles[candles.length - 1];
  const cutoff = latest.time - days * DAY_SECONDS;

  // Candles are ascending by time; find the first candle at/after the cutoff.
  const reference = candles.find((candle) => candle.time >= cutoff) ?? candles[0];

  if (!reference.close || reference.close === 0) {
    return null;
  }

  return ((latest.close - reference.close) / reference.close) * 100;
}

function describeVolumeTrend(candles: Candle[]): string {
  if (candles.length < 10) {
    return "insufficient volume history";
  }

  const recent = candles.slice(-5);
  const prior = candles.slice(-10, -5);
  const avg = (group: Candle[]) => group.reduce((sum, candle) => sum + candle.volume, 0) / group.length;
  const recentAvg = avg(recent);
  const priorAvg = avg(prior);

  if (priorAvg === 0) {
    return "flat";
  }

  const change = ((recentAvg - priorAvg) / priorAvg) * 100;

  if (change > 15) {
    return `rising (+${change.toFixed(0)}% vs prior week)`;
  }

  if (change < -15) {
    return `falling (${change.toFixed(0)}% vs prior week)`;
  }

  return "roughly flat";
}

function formatPct(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function buildPrompt(
  ticker: string,
  candles: Candle[],
  newsHeadlines: string[],
  newsTally: { bullish: number; bearish: number; neutral: number },
  insiderTally: { bullish: number; bearish: number; neutral: number }
): string {
  const latest = candles[candles.length - 1];
  const lines = [
    `Ticker: ${ticker}`,
    latest ? `Latest close: ${latest.close}` : "Latest close: n/a",
    `Price change 1W: ${formatPct(pctChangeOverDays(candles, 7))}`,
    `Price change 1M: ${formatPct(pctChangeOverDays(candles, 30))}`,
    `Price change 3M: ${formatPct(pctChangeOverDays(candles, 90))}`,
    `Price change 6M: ${formatPct(pctChangeOverDays(candles, 183))}`,
    `Volume trend: ${describeVolumeTrend(candles)}`,
    `Recent news sentiment counts -> bullish: ${newsTally.bullish}, bearish: ${newsTally.bearish}, neutral: ${newsTally.neutral}`,
    `Recent insider activity counts -> acquisitions: ${insiderTally.bullish}, disposals: ${insiderTally.bearish}, other: ${insiderTally.neutral}`
  ];

  if (newsHeadlines.length > 0) {
    lines.push("Representative recent headlines:");
    newsHeadlines.forEach((headline) => lines.push(`- ${headline}`));
  }

  return lines.join("\n");
}

function tallyDirections(directions: string[]) {
  return directions.reduce(
    (acc, direction) => {
      if (direction === "bullish") {
        acc.bullish += 1;
      } else if (direction === "bearish") {
        acc.bearish += 1;
      } else {
        acc.neutral += 1;
      }
      return acc;
    },
    { bullish: 0, bearish: 0, neutral: 0 }
  );
}

function normalizeOutlook(ticker: string, parsed: ParsedOutlook): AiOutlook {
  const up = Math.round(Math.min(Math.max(parsed.probabilityUp, 0), 100));
  // Force the pair to sum to 100 so the UI is always consistent.
  const down = 100 - up;

  return {
    ticker,
    probabilityUp: up,
    probabilityDown: down,
    confidence: parsed.confidence,
    rationale: parsed.rationale.trim(),
    model: OUTLOOK_MODEL
  };
}

function neutralOutlook(ticker: string): AiOutlook {
  return {
    ticker,
    probabilityUp: 50,
    probabilityDown: 50,
    confidence: "low",
    rationale: "Not enough reliable data to generate a confident outlook.",
    model: OUTLOOK_MODEL
  };
}

export async function generateOutlook(ticker: string): Promise<void> {
  const upper = ticker.toUpperCase();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      return;
    }

    const [candles, news, insiders] = await Promise.all([
      getMarketDataProvider().getCandles(upper, "6M").catch(() => [] as Candle[]),
      readCachedSignals({ signalType: "news", ticker: upper, limit: 20 }),
      readCachedSignals({ signalType: "insider", ticker: upper, limit: 20 })
    ]);

    let outlook: AiOutlook;

    if (candles.length < 2) {
      outlook = neutralOutlook(upper);
    } else {
      const newsTally = tallyDirections(news.signals.map((signal) => signal.direction));
      const insiderTally = tallyDirections(insiders.signals.map((signal) => signal.direction));
      const newsHeadlines = news.signals
        .map((signal) => signal.description)
        .filter((description): description is string => Boolean(description))
        .slice(0, 6);

      const prompt = buildPrompt(upper, candles, newsHeadlines, newsTally, insiderTally);

      const client = new Anthropic({ apiKey });

      try {
        const response = await client.messages.parse({
          model: OUTLOOK_MODEL,
          max_tokens: 1024,
          system:
            "You are a market analyst. Estimate the probability that a stock will move UP versus DOWN over the next 1-2 weeks, based ONLY on the quantitative price action and signal summary provided. Do not rely on outside knowledge of the company. probabilityUp and probabilityDown must each be 0-100 and sum to 100. Set confidence to low when the data is sparse or conflicting. Keep the rationale to 2-3 concise sentences. This is informational only, not financial advice.",
          messages: [{ role: "user", content: prompt }],
          output_config: { format: zodOutputFormat(OutlookSchema) }
        });

        outlook = response.parsed_output
          ? normalizeOutlook(upper, response.parsed_output)
          : neutralOutlook(upper);
      } catch {
        outlook = neutralOutlook(upper);
      }
    }

    const supabase = createAdminClient();
    await supabase.from("ai_outlooks").upsert(
      {
        ticker: outlook.ticker,
        probability_up: outlook.probabilityUp,
        probability_down: outlook.probabilityDown,
        confidence: outlook.confidence,
        rationale: outlook.rationale,
        model: outlook.model,
        generated_at: new Date().toISOString()
      },
      { onConflict: "ticker" }
    );
  } catch {
    // Outlook generation is best-effort; never throw into the request path.
  }
}
