export type SignalDirection = "bullish" | "bearish";

export type DemoStockSignal = {
  ticker: string;
  companyName: string;
  score: number;
  direction: SignalDirection;
  signals: string[];
  updatedAt: string;
};

export const demoStockSignals: DemoStockSignal[] = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    score: 91,
    direction: "bullish",
    signals: ["insider", "contract", "news"],
    updatedAt: "12 min ago"
  },
  {
    ticker: "PLTR",
    companyName: "Palantir Technologies",
    score: 84,
    direction: "bullish",
    signals: ["contract", "political", "news"],
    updatedAt: "19 min ago"
  },
  {
    ticker: "LLY",
    companyName: "Eli Lilly and Company",
    score: 78,
    direction: "bullish",
    signals: ["insider", "political"],
    updatedAt: "27 min ago"
  },
  {
    ticker: "BA",
    companyName: "The Boeing Company",
    score: 88,
    direction: "bearish",
    signals: ["news", "contract"],
    updatedAt: "14 min ago"
  },
  {
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    score: 81,
    direction: "bearish",
    signals: ["insider", "news"],
    updatedAt: "22 min ago"
  },
  {
    ticker: "PFE",
    companyName: "Pfizer Inc.",
    score: 73,
    direction: "bearish",
    signals: ["political", "news"],
    updatedAt: "35 min ago"
  }
];
