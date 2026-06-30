-- Enables upserts on stock_scores keyed by ticker.
drop index if exists stock_scores_ticker_idx;
create unique index if not exists stock_scores_ticker_key on stock_scores (ticker);
