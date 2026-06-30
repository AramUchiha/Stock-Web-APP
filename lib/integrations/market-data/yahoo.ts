import YahooFinance from "yahoo-finance2";
import type {
  Candle,
  ChartRange,
  CompanyProfile,
  MarketDataProvider,
  Quote,
  SymbolMatch
} from "@/lib/integrations/market-data/types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const MODULE_OPTIONS = { validateResult: false } as const;

type RangeConfig = {
  interval: "5m" | "15m" | "30m" | "1d" | "1wk";
  msBack: number;
};

const DAY = 24 * 60 * 60 * 1000;

const RANGE_CONFIG: Record<ChartRange, RangeConfig> = {
  "1D": { interval: "5m", msBack: 1 * DAY },
  "5D": { interval: "30m", msBack: 6 * DAY },
  "1M": { interval: "1d", msBack: 31 * DAY },
  "6M": { interval: "1d", msBack: 183 * DAY },
  "1Y": { interval: "1d", msBack: 366 * DAY },
  "5Y": { interval: "1wk", msBack: 5 * 366 * DAY }
};

type YahooQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: Date | string;
  fullExchangeName?: string;
  exchange?: string;
  marketState?: string;
};

type YahooChart = {
  meta?: { symbol?: string };
  quotes?: Array<{
    date: Date | string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  }>;
};

type YahooSearch = {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    typeDisp?: string;
    isYahooFinance?: boolean;
  }>;
};

type YahooSummary = {
  price?: { currency?: string; exchangeName?: string; shortName?: string; longName?: string };
  assetProfile?: { sector?: string; industry?: string; website?: string; longBusinessSummary?: string };
  summaryProfile?: { sector?: string; industry?: string; website?: string; longBusinessSummary?: string };
};

function toIso(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export const yahooProvider: MarketDataProvider = {
  async searchSymbols(query, limit = 8) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const result = (await yf.search(
      trimmed,
      { quotesCount: limit, newsCount: 0, enableFuzzyQuery: false },
      MODULE_OPTIONS
    )) as YahooSearch;

    return (result.quotes ?? [])
      .filter((quote) => typeof quote.symbol === "string" && quote.symbol.length > 0 && quote.isYahooFinance !== false)
      .slice(0, limit)
      .map<SymbolMatch>((quote) => ({
        ticker: quote.symbol as string,
        name: quote.longname ?? quote.shortname,
        exchange: quote.exchange,
        type: quote.typeDisp
      }));
  },

  async getQuote(ticker) {
    const quote = (await yf.quote(ticker, {}, MODULE_OPTIONS)) as YahooQuote | undefined;

    if (!quote || typeof quote.regularMarketPrice !== "number") {
      return null;
    }

    const price = quote.regularMarketPrice;
    const previousClose = quote.regularMarketPreviousClose;
    const change = quote.regularMarketChange ?? (typeof previousClose === "number" ? price - previousClose : 0);
    const percentChange =
      quote.regularMarketChangePercent ??
      (typeof previousClose === "number" && previousClose > 0 ? (change / previousClose) * 100 : 0);

    return {
      ticker: (quote.symbol ?? ticker).toUpperCase(),
      name: quote.longName ?? quote.shortName,
      currency: quote.currency,
      price,
      previousClose,
      change,
      percentChange,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      marketTime: toIso(quote.regularMarketTime),
      exchange: quote.fullExchangeName ?? quote.exchange,
      marketState: quote.marketState
    } satisfies Quote;
  },

  async getCandles(ticker, range) {
    const config = RANGE_CONFIG[range];
    const period1 = new Date(Date.now() - config.msBack);

    const result = (await yf.chart(
      ticker,
      { period1, interval: config.interval },
      MODULE_OPTIONS
    )) as YahooChart;

    const quotes = result.quotes ?? [];

    return quotes
      .map<Candle | null>((quote) => {
        const date = quote.date instanceof Date ? quote.date : new Date(quote.date);
        if (
          Number.isNaN(date.getTime()) ||
          quote.open === null ||
          quote.high === null ||
          quote.low === null ||
          quote.close === null
        ) {
          return null;
        }

        return {
          time: Math.floor(date.getTime() / 1000),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume ?? 0
        };
      })
      .filter((candle): candle is Candle => candle !== null);
  },

  async getProfile(ticker) {
    const summary = (await yf.quoteSummary(
      ticker,
      { modules: ["price", "assetProfile", "summaryProfile"] },
      MODULE_OPTIONS
    )) as YahooSummary;

    const profile = summary.assetProfile ?? summary.summaryProfile;

    if (!summary.price && !profile) {
      return null;
    }

    return {
      ticker: ticker.toUpperCase(),
      name: summary.price?.longName ?? summary.price?.shortName,
      exchange: summary.price?.exchangeName,
      currency: summary.price?.currency,
      sector: profile?.sector,
      industry: profile?.industry,
      website: profile?.website,
      description: profile?.longBusinessSummary
    } satisfies CompanyProfile;
  }
};
