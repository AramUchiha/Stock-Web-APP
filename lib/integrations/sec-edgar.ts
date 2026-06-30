import { fetchJson, fetchText } from "@/lib/integrations/http";
import { trackedCompanies, type TrackedCompany } from "@/lib/market/companies";

const SEC_SUBMISSIONS_BASE_URL = "https://data.sec.gov/submissions";
const SEC_ARCHIVES_BASE_URL = "https://www.sec.gov/Archives/edgar/data";
const SEC_TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json";
const TICKER_MAP_TTL_MS = 24 * 60 * 60 * 1000;

export type SecInsiderTransaction = {
  ticker: string;
  companyName: string;
  cik: string;
  accessionNumber: string;
  filingDate: string;
  reportDate?: string;
  filedAt?: string;
  ownerName?: string;
  transactionDate?: string;
  transactionCode?: string;
  acquiredDisposedCode?: string;
  shares?: number;
  pricePerShare?: number;
  sharesOwnedFollowing?: number;
  filingUrl: string;
};

type SecCompanySubmissions = {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      acceptanceDateTime?: string[];
      form?: string[];
      primaryDocument?: string[];
    };
  };
};

type SecRecentFiling = {
  accessionNumber: string;
  filingDate: string;
  reportDate?: string;
  filedAt?: string;
  primaryDocument: string;
};

type GetRecentSecInsiderTransactionsOptions = {
  ticker?: string;
  limit?: number;
};

type SecTickerMapEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

let tickerMapCache: { map: Map<string, SecTickerMapEntry>; expiresAt: number } | null = null;

async function getSecTickerMap() {
  if (tickerMapCache && tickerMapCache.expiresAt > Date.now()) {
    return tickerMapCache.map;
  }

  const data = await fetchJson<Record<string, SecTickerMapEntry>>(new URL(SEC_TICKER_MAP_URL), {
    headers: { "User-Agent": getSecUserAgent() },
    timeoutMs: 10_000
  });

  const map = new Map<string, SecTickerMapEntry>();
  for (const entry of Object.values(data)) {
    if (entry?.ticker) {
      map.set(entry.ticker.toUpperCase(), entry);
    }
  }

  tickerMapCache = { map, expiresAt: Date.now() + TICKER_MAP_TTL_MS };
  return map;
}

export async function resolveCompany(ticker: string): Promise<TrackedCompany | null> {
  const upper = ticker.toUpperCase();
  const tracked = trackedCompanies.find((company) => company.ticker === upper);

  if (tracked) {
    return tracked;
  }

  const map = await getSecTickerMap();
  const entry = map.get(upper);

  if (!entry) {
    return null;
  }

  return {
    ticker: upper,
    companyName: entry.title,
    cik: String(entry.cik_str).padStart(10, "0"),
    searchTerms: [entry.title]
  };
}

function getSecUserAgent() {
  return process.env.SEC_USER_AGENT || "StockSignal contact@example.com";
}

function cikForUrl(cik: string) {
  return cik.padStart(10, "0");
}

function cikForArchivePath(cik: string) {
  return String(Number(cik));
}

function accessionForArchivePath(accessionNumber: string) {
  return accessionNumber.replaceAll("-", "");
}

function buildFilingUrl(company: TrackedCompany, filing: SecRecentFiling) {
  return `${SEC_ARCHIVES_BASE_URL}/${cikForArchivePath(company.cik)}/${accessionForArchivePath(filing.accessionNumber)}/${filing.primaryDocument}`;
}

function getXmlValue(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>\\s*(?:<value>)?\\s*([^<]+?)\\s*(?:</value>)?\\s*</${tagName}>`, "i"));
  return match?.[1]?.trim();
}

function getTransactionBlocks(xml: string) {
  return Array.from(xml.matchAll(/<nonDerivativeTransaction>[\s\S]*?<\/nonDerivativeTransaction>/gi)).map((match) => match[0]);
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRecentForm4Filings(submissions: SecCompanySubmissions, limit: number) {
  const recent = submissions.filings?.recent;

  if (!recent?.accessionNumber || !recent.form || !recent.filingDate || !recent.primaryDocument) {
    return [];
  }

  const filings: SecRecentFiling[] = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const form = recent.form[index];
    const accessionNumber = recent.accessionNumber[index];
    const filingDate = recent.filingDate[index];
    const primaryDocument = recent.primaryDocument[index];

    if (!form?.startsWith("4") || !accessionNumber || !filingDate || !primaryDocument) {
      continue;
    }

    filings.push({
      accessionNumber,
      filingDate,
      reportDate: recent.reportDate?.[index],
      filedAt: recent.acceptanceDateTime?.[index],
      primaryDocument
    });

    if (filings.length >= limit) {
      break;
    }
  }

  return filings;
}

async function getCompanySubmissions(company: TrackedCompany) {
  const url = new URL(`${SEC_SUBMISSIONS_BASE_URL}/CIK${cikForUrl(company.cik)}.json`);

  return fetchJson<SecCompanySubmissions>(url, {
    headers: {
      "User-Agent": getSecUserAgent()
    }
  });
}

async function getTransactionsFromFiling(company: TrackedCompany, filing: SecRecentFiling): Promise<SecInsiderTransaction[]> {
  const filingUrl = buildFilingUrl(company, filing);
  const xml = await fetchText(new URL(filingUrl), {
    headers: {
      "User-Agent": getSecUserAgent()
    }
  });

  const ownerName = getXmlValue(xml, "rptOwnerName");
  const transactionBlocks = getTransactionBlocks(xml);

  if (transactionBlocks.length === 0) {
    return [
      {
        ticker: company.ticker,
        companyName: company.companyName,
        cik: company.cik,
        accessionNumber: filing.accessionNumber,
        filingDate: filing.filingDate,
        reportDate: filing.reportDate,
        filedAt: filing.filedAt,
        ownerName,
        filingUrl
      }
    ];
  }

  return transactionBlocks.map<SecInsiderTransaction>((block) => ({
    ticker: company.ticker,
    companyName: company.companyName,
    cik: company.cik,
    accessionNumber: filing.accessionNumber,
    filingDate: filing.filingDate,
    reportDate: filing.reportDate,
    filedAt: filing.filedAt,
    ownerName,
    transactionDate: getXmlValue(block, "transactionDate"),
    transactionCode: getXmlValue(block, "transactionCode"),
    acquiredDisposedCode: getXmlValue(block, "transactionAcquiredDisposedCode"),
    shares: parseNumber(getXmlValue(block, "transactionShares")),
    pricePerShare: parseNumber(getXmlValue(block, "transactionPricePerShare")),
    sharesOwnedFollowing: parseNumber(getXmlValue(block, "sharesOwnedFollowingTransaction")),
    filingUrl
  }));
}

async function getCompanyTransactions(company: TrackedCompany, limit: number) {
  const submissions = await getCompanySubmissions(company);
  const filings = toRecentForm4Filings(submissions, limit);
  const transactionGroups = await Promise.all(filings.map((filing) => getTransactionsFromFiling(company, filing)));

  return transactionGroups.flat();
}

export async function getRecentSecInsiderTransactions({ ticker, limit = 20 }: GetRecentSecInsiderTransactionsOptions = {}) {
  const companies = ticker
    ? trackedCompanies.filter((company) => company.ticker === ticker.toUpperCase())
    : trackedCompanies;

  if (companies.length === 0) {
    return [];
  }

  const perCompanyLimit = ticker ? limit : Math.max(2, Math.ceil(limit / companies.length));
  const transactionGroups = await Promise.all(companies.map((company) => getCompanyTransactions(company, perCompanyLimit)));

  return transactionGroups
    .flat()
    .sort((left, right) => (right.filedAt ?? right.filingDate).localeCompare(left.filedAt ?? left.filingDate))
    .slice(0, limit);
}

export async function getInsiderTransactionsForTicker(ticker: string, limit = 5): Promise<SecInsiderTransaction[]> {
  const company = await resolveCompany(ticker);

  if (!company) {
    return [];
  }

  const transactions = await getCompanyTransactions(company, limit);

  return transactions
    .sort((left, right) => (right.filedAt ?? right.filingDate).localeCompare(left.filedAt ?? left.filingDate))
    .slice(0, limit);
}
