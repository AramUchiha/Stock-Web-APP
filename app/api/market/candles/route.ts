import { NextResponse, type NextRequest } from "next/server";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { isChartRange } from "@/lib/integrations/market-data/types";
import { cached, normalizeTickerParam } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANDLES_TTL_MS = 5 * 60_000;

export async function GET(request: NextRequest) {
  const ticker = normalizeTickerParam(request.nextUrl.searchParams.get("ticker"));
  const rangeParam = request.nextUrl.searchParams.get("range");
  const range = isChartRange(rangeParam) ? rangeParam : "1M";

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  try {
    const candles = await cached(`candles:${ticker}:${range}`, CANDLES_TTL_MS, () =>
      getMarketDataProvider().getCandles(ticker, range)
    );

    return NextResponse.json({ ticker, range, candles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load candles." },
      { status: 502 }
    );
  }
}
