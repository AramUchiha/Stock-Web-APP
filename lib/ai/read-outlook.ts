import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type AiOutlookRow = Database["public"]["Tables"]["ai_outlooks"]["Row"];

export type ReadOutlookResult = {
  outlook: AiOutlookRow | null;
  error: string | null;
};

export async function readOutlook(ticker: string): Promise<ReadOutlookResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ai_outlooks")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .maybeSingle();

    if (error) {
      return { outlook: null, error: error.message };
    }

    return { outlook: data ?? null, error: null };
  } catch (error) {
    return {
      outlook: null,
      error: error instanceof Error ? error.message : "Unable to read AI outlook."
    };
  }
}
