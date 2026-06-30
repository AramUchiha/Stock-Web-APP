export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          stripe_customer_id: string | null;
          subscription_status: string | null;
          subscription_end_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          subscription_end_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          subscription_end_date?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      signals: {
        Row: {
          id: string;
          ticker: string;
          company_name: string | null;
          signal_type: string;
          direction: string;
          source: string | null;
          actor: string | null;
          dollar_amount: number | null;
          description: string | null;
          signal_date: string | null;
          raw_url: string | null;
          external_id: string | null;
          source_published_at: string | null;
          raw_payload: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          ticker: string;
          company_name?: string | null;
          signal_type: string;
          direction: string;
          source?: string | null;
          actor?: string | null;
          dollar_amount?: number | null;
          description?: string | null;
          signal_date?: string | null;
          raw_url?: string | null;
          external_id?: string | null;
          source_published_at?: string | null;
          raw_payload?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          ticker?: string;
          company_name?: string | null;
          signal_type?: string;
          direction?: string;
          source?: string | null;
          actor?: string | null;
          dollar_amount?: number | null;
          description?: string | null;
          signal_date?: string | null;
          raw_url?: string | null;
          external_id?: string | null;
          source_published_at?: string | null;
          raw_payload?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      stock_scores: {
        Row: {
          id: string;
          ticker: string;
          company_name: string | null;
          bullish_score: number | null;
          bearish_score: number | null;
          signal_count: number | null;
          top_signals: Json | null;
          last_refreshed: string | null;
        };
        Insert: {
          id?: string;
          ticker: string;
          company_name?: string | null;
          bullish_score?: number | null;
          bearish_score?: number | null;
          signal_count?: number | null;
          top_signals?: Json | null;
          last_refreshed?: string | null;
        };
        Update: {
          id?: string;
          ticker?: string;
          company_name?: string | null;
          bullish_score?: number | null;
          bearish_score?: number | null;
          signal_count?: number | null;
          top_signals?: Json | null;
          last_refreshed?: string | null;
        };
        Relationships: [];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string | null;
          ticker: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          ticker: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          ticker?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      ai_outlooks: {
        Row: {
          id: string;
          ticker: string;
          probability_up: number;
          probability_down: number;
          confidence: string | null;
          rationale: string | null;
          model: string;
          generated_at: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          probability_up: number;
          probability_down: number;
          confidence?: string | null;
          rationale?: string | null;
          model: string;
          generated_at?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          probability_up?: number;
          probability_down?: number;
          confidence?: string | null;
          rationale?: string | null;
          model?: string;
          generated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
