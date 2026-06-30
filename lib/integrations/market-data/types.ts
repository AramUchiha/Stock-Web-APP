export type Quote = {
  ticker: string;
  name?: string;
  currency?: string;
  price: number;
  previousClose?: number;
  change: number;
  percentChange: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketTime?: string;
  exchange?: string;
  marketState?: string;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SymbolMatch = {
  ticker: string;
  name?: string;
  exchange?: string;
  type?: string;
};

export type CompanyProfile = {
  ticker: string;
  name?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  website?: string;
  description?: string;
};

export type ChartRange = "1D" | "5D" | "1M" | "6M" | "1Y" | "5Y";

export const CHART_RANGES: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y"];

export function isChartRange(value: string | null | undefined): value is ChartRange {
  return !!value && (CHART_RANGES as string[]).includes(value);
}

export interface MarketDataProvider {
  searchSymbols(query: string, limit?: number): Promise<SymbolMatch[]>;
  getQuote(ticker: string): Promise<Quote | null>;
  getCandles(ticker: string, range: ChartRange): Promise<Candle[]>;
  getProfile(ticker: string): Promise<CompanyProfile | null>;
}
