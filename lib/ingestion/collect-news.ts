import { searchGdeltNews } from "@/lib/integrations/gdelt";
import { getFinnhubCompanyNews } from "@/lib/integrations/finnhub-news";
import { getYahooFinanceNewsForQueries } from "@/lib/integrations/yahoo-news";
import { normalizeGdeltArticle } from "@/lib/ingestion/gdelt-news";
import { normalizeFinnhubNewsArticle } from "@/lib/ingestion/finnhub-news";
import { dedupeByExternalKey } from "@/lib/ingestion/dedupe-news";
import { normalizeYahooNewsArticle } from "@/lib/ingestion/yahoo-news";
import type { SignalInput } from "@/lib/ingestion/types";
import type { TrackedCompany } from "@/lib/market/companies";

export type CollectNewsOptions = {
  company: TrackedCompany;
  gdeltMaxRecords?: number;
  gdeltTimespan?: string;
  yahooNewsCount?: number;
  finnhubDaysBack?: number;
  finnhubLimit?: number;
  maxItems?: number;
};

const DEFAULTS = {
  gdeltMaxRecords: 250,
  gdeltTimespan: "7d",
  yahooNewsCount: 50,
  finnhubDaysBack: 14,
  finnhubLimit: 50,
  maxItems: 50
} as const;

export async function collectNewsForCompany(options: CollectNewsOptions): Promise<SignalInput[]> {
  const {
    company,
    gdeltMaxRecords = DEFAULTS.gdeltMaxRecords,
    gdeltTimespan = DEFAULTS.gdeltTimespan,
    yahooNewsCount = DEFAULTS.yahooNewsCount,
    finnhubDaysBack = DEFAULTS.finnhubDaysBack,
    finnhubLimit = DEFAULTS.finnhubLimit,
    maxItems = DEFAULTS.maxItems
  } = options;

  const yahooQueries = Array.from(new Set([company.ticker, ...company.searchTerms]));
  const [gdeltArticles, yahooArticles, finnhubArticles] = await Promise.all([
    searchGdeltNews({
      company,
      maxRecords: gdeltMaxRecords,
      timespan: gdeltTimespan,
      requireTrustedDomain: false
    }).catch(() => []),
    getYahooFinanceNewsForQueries(yahooQueries, yahooNewsCount).catch(() => []),
    getFinnhubCompanyNews(company.ticker, finnhubDaysBack, finnhubLimit).catch(() => [])
  ]);

  const gdeltSignals = gdeltArticles
    .map((article) => normalizeGdeltArticle(company, article))
    .filter((signal): signal is SignalInput => signal !== null);

  const yahooSignals = yahooArticles
    .map((article) => normalizeYahooNewsArticle(company, article))
    .filter((signal): signal is SignalInput => signal !== null);

  const finnhubSignals = finnhubArticles
    .map((article) => normalizeFinnhubNewsArticle(company, article))
    .filter((signal): signal is SignalInput => signal !== null);

  const allSignals = dedupeByExternalKey([...finnhubSignals, ...yahooSignals, ...gdeltSignals]);
  const sorted = allSignals.sort((left, right) => {
    const leftTime = left.sourcePublishedAt ? new Date(left.sourcePublishedAt).getTime() : 0;
    const rightTime = right.sourcePublishedAt ? new Date(right.sourcePublishedAt).getTime() : 0;
    return rightTime - leftTime;
  });

  return typeof maxItems === "number" ? sorted.slice(0, maxItems) : sorted;
}
