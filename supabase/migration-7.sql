-- Migration 7: favorites (stars) saved to the account, not only to the browser.
-- Run after migration-6 in the Supabase SQL Editor.

create table if not exists saved_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table saved_items enable row level security;

drop policy if exists saved_items_own on saved_items;
create policy saved_items_own on saved_items for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on saved_items from anon;
grant select, insert, delete on saved_items to authenticated;
