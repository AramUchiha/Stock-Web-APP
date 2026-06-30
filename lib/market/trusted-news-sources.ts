const trustedNewsDomains = [
  "apnews.com",
  "barrons.com",
  "bloomberg.com",
  "businessinsider.com",
  "businesswire.com",
  "cnbc.com",
  "finance.yahoo.com",
  "forbes.com",
  "ft.com",
  "investors.com",
  "marketwatch.com",
  "morningstar.com",
  "nasdaq.com",
  "prnewswire.com",
  "reuters.com",
  "sec.gov",
  "seekingalpha.com",
  "theglobeandmail.com",
  "thestreet.com",
  "wsj.com",
  "zacks.com"
];

export function normalizeDomain(domain: string | undefined) {
  return domain?.toLowerCase().replace(/^www\./, "").trim() ?? "";
}

export function isTrustedNewsDomain(domain: string | undefined) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return false;
  }

  return trustedNewsDomains.some(
    (trustedDomain) => normalizedDomain === trustedDomain || normalizedDomain.endsWith(`.${trustedDomain}`)
  );
}

