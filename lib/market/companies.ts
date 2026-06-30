export type TrackedCompany = {
  ticker: string;
  companyName: string;
  cik: string;
  searchTerms: string[];
};

export const trackedCompanies: TrackedCompany[] = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    cik: "0001045810",
    searchTerms: ["NVIDIA", "NVIDIA Corporation"]
  },
  {
    ticker: "PLTR",
    companyName: "Palantir Technologies Inc.",
    cik: "0001321655",
    searchTerms: ["Palantir", "Palantir Technologies"]
  },
  {
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    cik: "0001318605",
    searchTerms: ["Tesla", "Tesla Inc"]
  },
  {
    ticker: "BA",
    companyName: "The Boeing Company",
    cik: "0000012927",
    searchTerms: ["Boeing", "The Boeing Company"]
  },
  {
    ticker: "LLY",
    companyName: "Eli Lilly and Company",
    cik: "0000059478",
    searchTerms: ["Eli Lilly", "Eli Lilly and Company"]
  },
  {
    ticker: "PFE",
    companyName: "Pfizer Inc.",
    cik: "0000078003",
    searchTerms: ["Pfizer", "Pfizer Inc"]
  }
];
