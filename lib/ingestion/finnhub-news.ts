import type { FinnhubNewsArticle } from "@/lib/integrations/finnhub-news";
import type { TrackedCompany } from "@/lib/market/companies";
import type { Json } from "@/lib/database.types";
import { inferNewsDirection } from "@/lib/ingestion/infer-news-direction";
import type { SignalInput } from "@/lib/ingestion/types";

export function normalizeFinnhubNewsArticle(company: TrackedCompany, article: FinnhubNewsArticle): SignalInput | null {
  const title = article.headline?.trim();

  if (!title || !article.url) {
    return null;
  }

  const publishedAt = new Date(article.datetime * 1000).toISOString();

  return {
    ticker: company.ticker,
    companyName: company.companyName,
    signalType: "news",
    direction: inferNewsDirection(title),
    source: "finnhub",
    actor: article.source ?? "Finnhub",
    description: title,
    signalDate: publishedAt.slice(0, 10),
    rawUrl: article.url,
    externalId: String(article.id),
    sourcePublishedAt: publishedAt,
    rawPayload: article as unknown as Json
  };
}
