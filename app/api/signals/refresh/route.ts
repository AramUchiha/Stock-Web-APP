import { NextResponse, type NextRequest } from "next/server";
import { ensureTickerSignals } from "@/lib/ingestion/on-demand";
import { normalizeTicker } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const ticker = normalizeTicker(request.nextUrl.searchParams.get("ticker") ?? undefined);
  const companyName = request.nextUrl.searchParams.get("companyName")?.trim() || undefined;

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  try {
    await ensureTickerSignals(ticker, companyName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Refresh failed." },
      { status: 500 }
    );
  }
}
