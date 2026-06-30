import type { YahooNewsArticle } from "@/lib/integrations/yahoo-news";
import type { TrackedCompany } from "@/lib/market/companies";
import type { Json } from "@/lib/database.types";
import { inferNewsDirection } from "@/lib/ingestion/infer-news-direction";
import type { SignalInput } from "@/lib/ingestion/types";

function toIso(value: Date | string | number | undefined) {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  return undefined;
}

export function normalizeYahooNewsArticle(company: TrackedCompany, article: YahooNewsArticle): SignalInput | null {
  const title = article.title.trim();

  if (!title || !article.link) {
    return null;
  }

  const publishedAt = toIso(article.providerPublishTime) ?? new Date().toISOString();

  return {
    ticker: company.ticker,
    companyName: company.companyName,
    signalType: "news",
    direction: inferNewsDirection(title),
    source: "yahoo_finance_news",
    actor: article.publisher ?? "Yahoo Finance",
    description: title,
    signalDate: publishedAt.slice(0, 10),
    rawUrl: article.link,
    externalId: article.uuid ?? article.link,
    sourcePublishedAt: publishedAt,
    rawPayload: article as unknown as Json
  };
}
