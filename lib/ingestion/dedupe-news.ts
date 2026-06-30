import type { SignalInput } from "@/lib/ingestion/types";

const SOURCE_PRIORITY: Record<string, number> = {
  finnhub: 4,
  yahoo_finance_news: 3,
  gdelt: 2
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "with"
]);

function normalizeUrl(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function tokenizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function jaccardSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  const union = leftSet.size + rightSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function publishedAtMs(signal: SignalInput) {
  if (!signal.sourcePublishedAt) {
    return 0;
  }

  const parsed = new Date(signal.sourcePublishedAt).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sourcePriority(signal: SignalInput) {
  return SOURCE_PRIORITY[signal.source] ?? 1;
}

function isDuplicateCandidate(existing: SignalInput, candidate: SignalInput) {
  const existingUrl = normalizeUrl(existing.rawUrl);
  const candidateUrl = normalizeUrl(candidate.rawUrl);

  if (existingUrl && candidateUrl && existingUrl === candidateUrl) {
    return true;
  }

  const existingTitle = existing.description ?? "";
  const candidateTitle = candidate.description ?? "";

  if (!existingTitle || !candidateTitle) {
    return false;
  }

  const similarity = jaccardSimilarity(tokenizeTitle(existingTitle), tokenizeTitle(candidateTitle));
  return similarity >= 0.72;
}

function pickPreferred(existing: SignalInput, candidate: SignalInput) {
  const existingTime = publishedAtMs(existing);
  const candidateTime = publishedAtMs(candidate);

  if (candidateTime !== existingTime) {
    return candidateTime > existingTime ? candidate : existing;
  }

  return sourcePriority(candidate) > sourcePriority(existing) ? candidate : existing;
}

export function dedupeNewsSignals(signals: SignalInput[], maxItems?: number) {
  const sorted = [...signals].sort((left, right) => publishedAtMs(right) - publishedAtMs(left));
  const kept: SignalInput[] = [];

  for (const candidate of sorted) {
    const duplicateIndex = kept.findIndex((existing) => isDuplicateCandidate(existing, candidate));

    if (duplicateIndex === -1) {
      kept.push(candidate);
      continue;
    }

    kept[duplicateIndex] = pickPreferred(kept[duplicateIndex], candidate);
  }

  const result = kept.sort((left, right) => publishedAtMs(right) - publishedAtMs(left));
  return typeof maxItems === "number" ? result.slice(0, maxItems) : result;
}

export function dedupeByExternalKey(signals: SignalInput[]) {
  const map = new Map<string, SignalInput>();

  for (const signal of signals) {
    map.set(`${signal.source}:${signal.externalId}`, signal);
  }

  return Array.from(map.values());
}
