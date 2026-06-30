import { inferNewsDirection } from "@/lib/ingestion/infer-news-direction";
import type { GdeltArticle } from "@/lib/integrations/gdelt";
import type { TrackedCompany } from "@/lib/market/companies";
import type { Json } from "@/lib/database.types";
import type { SignalInput } from "@/lib/ingestion/types";

function parseGdeltDate(value: string) {
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);

  if (compact) {
    const [, year, month, day, hour, minute, second] = compact;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeGdeltArticle(company: TrackedCompany, article: GdeltArticle): SignalInput | null {
  const title = article.title?.trim();

  if (!title || !article.url) {
    return null;
  }

  const publishedAt = parseGdeltDate(article.seendate);

  return {
    ticker: company.ticker,
    companyName: company.companyName,
    signalType: "news",
    direction: inferNewsDirection(title),
    source: "gdelt",
    actor: article.domain,
    description: title,
    signalDate: publishedAt ? publishedAt.toISOString().slice(0, 10) : undefined,
    rawUrl: article.url,
    externalId: article.url,
    sourcePublishedAt: publishedAt ? publishedAt.toISOString() : undefined,
    rawPayload: article as unknown as Json
  };
}
