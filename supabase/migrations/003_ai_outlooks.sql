create table ai_outlooks (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  probability_up integer not null,
  probability_down integer not null,
  confidence text,
  rationale text,
  model text not null,
  generated_at timestamptz not null default now()
);

create unique index ai_outlooks_ticker_key on ai_outlooks (ticker);

alter table ai_outlooks enable row level security;

create policy "Anyone can read ai outlook rows"
  on ai_outlooks for select
  to anon, authenticated
  using (true);
