import { NextResponse, type NextRequest } from "next/server";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { cached, normalizeTickerParam } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUOTE_TTL_MS = 30_000;

export async function GET(request: NextRequest) {
  const ticker = normalizeTickerParam(request.nextUrl.searchParams.get("ticker"));

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  try {
    const quote = await cached(`quote:${ticker}`, QUOTE_TTL_MS, () => getMarketDataProvider().getQuote(ticker));

    if (!quote) {
      return NextResponse.json({ error: `No quote found for ${ticker}.` }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load quote." },
      { status: 502 }
    );
  }
}
