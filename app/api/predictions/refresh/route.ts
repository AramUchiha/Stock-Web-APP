import { NextResponse, type NextRequest } from "next/server";
import { generateOutlook } from "@/lib/ai/generate-outlook";
import { readOutlook } from "@/lib/ai/read-outlook";
import { normalizeTicker } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OUTLOOK_TTL_MS = 12 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const ticker = normalizeTicker(request.nextUrl.searchParams.get("ticker") ?? undefined);

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  try {
    const { outlook } = await readOutlook(ticker);

    if (outlook?.generated_at) {
      const age = Date.now() - new Date(outlook.generated_at).getTime();
      if (age < OUTLOOK_TTL_MS) {
        return NextResponse.json({ ok: true, fresh: true });
      }
    }

    await generateOutlook(ticker);
    return NextResponse.json({ ok: true, fresh: false });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Refresh failed." },
      { status: 500 }
    );
  }
}
