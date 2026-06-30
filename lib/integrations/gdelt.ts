import { fetchJson } from "@/lib/integrations/http";
import type { TrackedCompany } from "@/lib/market/companies";

const GDELT_DOC_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

export type GdeltArticle = {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

type GdeltDocResponse = {
  articles?: unknown;
};

type SearchGdeltNewsOptions = {
  company: TrackedCompany;
  maxRecords?: number;
  timespan?: string;
};

function isGdeltArticle(value: unknown): value is GdeltArticle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const article = value as Record<string, unknown>;

  return typeof article.url === "string" && typeof article.title === "string" && typeof article.seendate === "string";
}

function isEnglishArticle(article: GdeltArticle) {
  if (!article.language) {
    return true;
  }

  return ["en", "eng", "english"].includes(article.language.toLowerCase());
}

function buildCompanyQuery(company: TrackedCompany) {
  const terms = company.searchTerms.map((term) => `"${term.replaceAll('"', "")}"`);
  return `(${terms.join(" OR ")}) sourcelang:english`;
}

export async function searchGdeltNews({
  company,
  maxRecords = 25,
  timespan = "1d"
}: SearchGdeltNewsOptions) {
  const url = new URL(GDELT_DOC_API_URL);
  url.searchParams.set("query", buildCompanyQuery(company));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(maxRecords));
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("timespan", timespan);

  const response = await fetchJson<GdeltDocResponse>(url, { timeoutMs: 10_000 });

  if (!Array.isArray(response.articles)) {
    return [];
  }

  return response.articles
    .filter(isGdeltArticle)
    .filter(isEnglishArticle);
}
