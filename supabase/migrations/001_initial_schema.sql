create extension if not exists pgcrypto;

create table profiles (
  id uuid references auth.users primary key,
  email text,
  stripe_customer_id text,
  subscription_status text default 'free',
  subscription_end_date timestamptz,
  created_at timestamptz default now()
);

create table signals (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  company_name text,
  signal_type text not null,
  direction text not null,
  source text,
  actor text,
  dollar_amount numeric,
  description text,
  signal_date date,
  raw_url text,
  external_id text,
  source_published_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz default now()
);

create table stock_scores (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  company_name text,
  bullish_score integer default 0,
  bearish_score integer default 0,
  signal_count integer default 0,
  top_signals jsonb,
  last_refreshed timestamptz default now()
);

create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  ticker text not null,
  created_at timestamptz default now()
);

create index signals_ticker_idx on signals (ticker);
create index signals_direction_idx on signals (direction);
create index signals_signal_type_idx on signals (signal_type);
create index signals_signal_date_idx on signals (signal_date desc);
create index signals_source_published_at_idx on signals (source_published_at desc);
create unique index signals_source_external_id_key on signals (source, external_id);
create index stock_scores_ticker_idx on stock_scores (ticker);
create index stock_scores_bullish_score_idx on stock_scores (bullish_score desc);
create index stock_scores_bearish_score_idx on stock_scores (bearish_score desc);
create index watchlist_user_id_idx on watchlist (user_id);
create unique index watchlist_user_ticker_key on watchlist (user_id, ticker);

alter table profiles enable row level security;
alter table signals enable row level security;
alter table stock_scores enable row level security;
alter table watchlist enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Anyone can read signal rows"
  on signals for select
  to anon, authenticated
  using (true);

create policy "Anyone can read score rows"
  on stock_scores for select
  to anon, authenticated
  using (true);

create policy "Users can read their own watchlist"
  on watchlist for select
  using ((select auth.uid()) = user_id);

create policy "Users can add to their own watchlist"
  on watchlist for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own watchlist"
  on watchlist for delete
  using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
