create extension if not exists pgcrypto;
create table if not exists public.wishlist (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 product_name text not null,
 product_url text not null,
 store text not null default 'Other',
 provider_product_id text,
 current_price numeric(12,2),
 previous_price numeric(12,2),
 target_price numeric(12,2) not null check(target_price >= 0),
 last_checked timestamptz,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.price_history (
 id bigint generated always as identity primary key,
 wishlist_id uuid not null references public.wishlist(id) on delete cascade,
 price numeric(12,2) not null check(price > 0),
 checked_at timestamptz not null default now()
);
create table if not exists public.alerts (
 id bigint generated always as identity primary key,
 wishlist_id uuid not null references public.wishlist(id) on delete cascade,
 alert_type text not null,
 message text not null,
 sent_at timestamptz not null default now()
);
create index if not exists price_history_wishlist_checked on public.price_history(wishlist_id,checked_at desc);
create index if not exists wishlist_user_active on public.wishlist(user_id,is_active);
-- Enable RLS. Policies scope every user's rows; service-role scheduled function bypasses RLS.
alter table public.wishlist enable row level security;
alter table public.price_history enable row level security;
alter table public.alerts enable row level security;
create policy "users manage own wishlist" on public.wishlist for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "users read own price history" on public.price_history for select using(exists(select 1 from public.wishlist w where w.id=wishlist_id and w.user_id=auth.uid()));
create policy "users read own alerts" on public.alerts for select using(exists(select 1 from public.wishlist w where w.id=wishlist_id and w.user_id=auth.uid()));