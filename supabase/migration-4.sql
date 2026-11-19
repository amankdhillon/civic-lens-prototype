-- Civic Lens migration 4: pins (follow bodies, add meetings to the calendar, pin items) and general discussion on places.
-- Run once in the SQL Editor after migration-3. Safe to re-run.

-- Pins belong to one person. Each row is a body they follow, a meeting on their calendar, or an item they pinned.
create table if not exists pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('body', 'meeting', 'item')),
  target_id text not null,
  created_at timestamptz not null default now(),
  constraint pins_one_per_target unique (user_id, kind, target_id)
);
alter table pins enable row level security;
drop policy if exists pins_own on pins;
create policy pins_own on pins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on pins from anon;
grant select, insert, delete on pins to authenticated;

-- General discussion on a place. Only residents of the place can post. Everyone can read.
create table if not exists place_comments (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references places(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('question', 'information', 'opinion')),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  created_at timestamptz not null default now(),
  constraint place_comments_info_needs_source check (kind <> 'information' or source_url <> '')
);
create index if not exists place_comments_idx on place_comments (place_id, created_at);
alter table place_comments enable row level security;
drop policy if exists place_comments_insert on place_comments;
create policy place_comments_insert on place_comments for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and place_comments.place_id = any (p.place_ids)
  )
);
create or replace view place_comment_view as
select c.id, c.place_id, c.kind, c.body, c.source_url, c.created_at, p.nickname as author_name
from place_comments c
join profiles p on p.id = c.author_id;
revoke all on place_comments from anon, authenticated;
grant insert on place_comments to authenticated;
grant select on place_comment_view to authenticated;
revoke all on place_comment_view from anon;
