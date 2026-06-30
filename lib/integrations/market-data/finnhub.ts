import type { MarketDataProvider } from "@/lib/integrations/market-data/types";

const NOT_IMPLEMENTED = "Finnhub provider is not implemented yet. Set MARKET_DATA_PROVIDER=yahoo or add an implementation.";

export const finnhubProvider: MarketDataProvider = {
  async searchSymbols() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async getQuote() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async getCandles() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async getProfile() {
    throw new Error(NOT_IMPLEMENTED);
  }
};
