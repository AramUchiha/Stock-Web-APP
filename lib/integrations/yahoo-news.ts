import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const MODULE_OPTIONS = { validateResult: false } as const;

export type YahooNewsArticle = {
  uuid: string;
  title: string;
  publisher?: string;
  link: string;
  providerPublishTime?: Date | string | number;
  relatedTickers?: string[];
};

type YahooSearchResult = {
  news?: unknown[];
};

function isYahooNewsArticle(value: unknown): value is YahooNewsArticle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const article = value as Record<string, unknown>;
  return typeof article.title === "string" && typeof article.link === "string";
}

export async function getYahooFinanceNewsForQueries(queries: string[], newsCount = 50): Promise<YahooNewsArticle[]> {
  const seen = new Map<string, YahooNewsArticle>();

  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const result = (await yf.search(
        trimmed,
        { quotesCount: 0, newsCount, enableFuzzyQuery: false },
        MODULE_OPTIONS
      )) as YahooSearchResult;

      for (const article of result.news ?? []) {
        if (!isYahooNewsArticle(article)) {
          continue;
        }

        const key = article.uuid ?? article.link;
        if (!seen.has(key)) {
          seen.set(key, { ...article, uuid: key });
        }
      }
    } catch {
      // try remaining queries
    }
  }

  return Array.from(seen.values());
}
