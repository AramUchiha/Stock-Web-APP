import { fetchJson } from "@/lib/integrations/http";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export type FinnhubNewsArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image?: string;
  related?: string;
  source: string;
  summary?: string;
  url: string;
};

function getFinnhubApiKey() {
  return process.env.FINNHUB_API_KEY?.trim() ?? "";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getFinnhubCompanyNews(ticker: string, daysBack = 14, limit = 50): Promise<FinnhubNewsArticle[]> {
  const apiKey = getFinnhubApiKey();

  if (!apiKey) {
    return [];
  }

  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - daysBack);

  const url = new URL(`${FINNHUB_BASE_URL}/company-news`);
  url.searchParams.set("symbol", ticker.toUpperCase());
  url.searchParams.set("from", formatDate(from));
  url.searchParams.set("to", formatDate(to));
  url.searchParams.set("token", apiKey);

  const articles = await fetchJson<FinnhubNewsArticle[]>(url, { timeoutMs: 10_000 });

  if (!Array.isArray(articles)) {
    return [];
  }

  return articles.slice(0, limit);
}
