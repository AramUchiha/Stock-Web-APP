import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type StockScoreRow = Database["public"]["Tables"]["stock_scores"]["Row"];

export type ReadScoresResult = {
  scores: StockScoreRow[];
  error: string | null;
};

export async function readStockScores(limit = 30): Promise<ReadScoresResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stock_scores")
      .select("*")
      .order("last_refreshed", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      return { scores: [], error: error.message };
    }

    return { scores: data ?? [], error: null };
  } catch (error) {
    return {
      scores: [],
      error: error instanceof Error ? error.message : "Unable to read stock scores."
    };
  }
}
