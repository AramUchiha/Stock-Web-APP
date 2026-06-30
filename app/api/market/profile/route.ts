import { NextResponse, type NextRequest } from "next/server";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { cached, normalizeTickerParam } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_TTL_MS = 6 * 60 * 60_000;

export async function GET(request: NextRequest) {
  const ticker = normalizeTickerParam(request.nextUrl.searchParams.get("ticker"));

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  try {
    const profile = await cached(`profile:${ticker}`, PROFILE_TTL_MS, () =>
      getMarketDataProvider().getProfile(ticker)
    );

    return NextResponse.json(profile ?? {});
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load profile." },
      { status: 502 }
    );
  }
}
