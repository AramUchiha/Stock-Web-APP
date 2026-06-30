import Link from "next/link";
import type { Json } from "@/lib/database.types";
import type { SignalRow } from "@/lib/ingestion/read-signals";
import { cleanText, extractStockMove, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type NewsFeedItemProps = {
  signal: SignalRow;
};

type ArticlePayload = {
  domain?: string;
  publisher?: string;
  socialimage?: string;
  image?: string;
  sourcecountry?: string;
  title?: string;
  thumbnail?: {
    resolutions?: Array<{
      url?: string;
      width?: number;
      height?: number;
      tag?: string;
    }>;
  };
};

function getPayload(rawPayload: Json | null): ArticlePayload {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return {};
  }

  return rawPayload as ArticlePayload;
}

function getTickerInitials(ticker: string) {
  return ticker.slice(0, 4).toUpperCase();
}

function getImageUrl(payload: ArticlePayload) {
  const resolutions = (payload.thumbnail?.resolutions ?? []).filter(
    (resolution): resolution is { url: string; width?: number; height?: number; tag?: string } =>
      typeof resolution.url === "string"
  );

  if (resolutions.length > 0) {
    const sized = [...resolutions].sort((left, right) => (left.width ?? 0) - (right.width ?? 0));
    const preferred = sized.find((resolution) => (resolution.width ?? 0) >= 140) ?? sized[sized.length - 1];
    return preferred.url;
  }

  if (typeof payload.socialimage === "string") {
    return payload.socialimage;
  }

  if (typeof payload.image === "string") {
    return payload.image;
  }

  return null;
}

function renderHeadlineWithMove(headline: string) {
  const move = extractStockMove(headline);

  if (!move) {
    return headline;
  }

  const [before, after] = headline.split(move.phrase);

  return (
    <>
      {before}
      <span
        className={cn(
          "mx-1 inline-flex rounded px-1.5 py-0.5 align-baseline text-sm font-bold",
          move.direction === "up" ? "bg-bullish/20 text-bullish" : "bg-bearish/20 text-bearish"
        )}
      >
        {move.percent}
      </span>
      {after}
    </>
  );
}

function formatSource(source: string | null | undefined) {
  switch (source) {
    case "finnhub":
      return "Finnhub";
    case "yahoo_finance_news":
      return "Yahoo Finance";
    case "gdelt":
      return "GDELT";
    default:
      return source ?? "Source";
  }
}

export function NewsFeedItem({ signal }: NewsFeedItemProps) {
  const payload = getPayload(signal.raw_payload);
  const headline = cleanText(signal.description ?? payload.title ?? "Untitled news item");
  const domain = cleanText(signal.actor ?? payload.publisher ?? payload.domain ?? formatSource(signal.source));
  const imageUrl = getImageUrl(payload);
  const excerpt = cleanText(headline.length > 120 ? `${headline.slice(0, 160)}...` : "");
  const sourceCountry = cleanText(payload.sourcecountry);

  return (
    <article className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <div className="grid grid-cols-[88px_1fr] gap-4 sm:grid-cols-[116px_1fr] sm:gap-5">
        <div
          className="flex aspect-square items-center justify-center overflow-hidden border border-zinc-900 bg-white text-center"
          style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
        >
          {!imageUrl ? <span className="font-mono text-lg font-bold text-zinc-950">{getTickerInitials(signal.ticker)}</span> : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono font-bold text-bullish">{signal.ticker}</span>
            <span>{domain}</span>
            {sourceCountry ? <span>{sourceCountry}</span> : null}
          </div>

          <h2 className="mt-2 max-w-3xl text-xl font-bold leading-snug tracking-tight text-zinc-100 sm:text-2xl">
            {signal.raw_url ? (
              <Link href={signal.raw_url} className="underline decoration-zinc-500 decoration-1 underline-offset-4 hover:text-white">
                {renderHeadlineWithMove(headline)}
              </Link>
            ) : (
              renderHeadlineWithMove(headline)
            )}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <time>{formatDateTime(signal.source_published_at)}</time>
            <span>Updated {formatDateTime(signal.created_at)}</span>
          </div>

          {excerpt ? <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{excerpt}</p> : null}
        </div>
      </div>
    </article>
  );
}
