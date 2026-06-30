import { NextResponse, type NextRequest } from "next/server";
import { getMarketDataProvider } from "@/lib/integrations/market-data";
import { cached } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_TTL_MS = 5 * 60_000;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await cached(`search:${query.toLowerCase()}`, SEARCH_TTL_MS, () =>
      getMarketDataProvider().searchSymbols(query, 8)
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed.", results: [] },
      { status: 502 }
    );
  }
}
