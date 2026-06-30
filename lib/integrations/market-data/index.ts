import { finnhubProvider } from "@/lib/integrations/market-data/finnhub";
import { yahooProvider } from "@/lib/integrations/market-data/yahoo";
import type { MarketDataProvider } from "@/lib/integrations/market-data/types";

export function getMarketDataProvider(): MarketDataProvider {
  const provider = process.env.MARKET_DATA_PROVIDER?.toLowerCase();

  switch (provider) {
    case "finnhub":
      return finnhubProvider;
    case "yahoo":
    default:
      return yahooProvider;
  }
}

export type {
  Candle,
  ChartRange,
  CompanyProfile,
  MarketDataProvider,
  Quote,
  SymbolMatch
} from "@/lib/integrations/market-data/types";
