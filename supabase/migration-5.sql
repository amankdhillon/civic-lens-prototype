-- Civic Lens migration 5: fictional congressional and state districts, subcommittees, community groups,
-- and discussions on meetings, government bodies, and community groups. Run once after migration-4. Safe to re-run.

-- Places can also be congressional and state districts.
alter table places drop constraint if exists places_kind_check;
alter table places add constraint places_kind_check check (kind in (
  'county', 'city', 'council_district', 'school_district', 'congressional_district', 'state_district', 'neighborhood'));

-- Bodies can be subcommittees (under a parent body) and community groups (not governing bodies).
alter table bodies add column if not exists parent_id text references bodies(id);
alter table bodies drop constraint if exists bodies_kind_check;
alter table bodies add constraint bodies_kind_check check (kind in ('governing', 'board', 'committee', 'community'));

-- Item discussions: residents of the body's place (or the body) can post.
drop policy if exists item_comments_insert on item_comments;
create policy item_comments_insert on item_comments for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1
    from items i
    join meetings m on m.id = i.meeting_id
    join bodies b on b.id = m.body_id
    join profiles p on p.id = auth.uid()
    where i.id = item_comments.item_id
      and (m.body_id = any (p.body_ids) or b.place_id = any (p.place_ids))
  )
);

-- Discussions on meetings, government bodies, and community groups. Residents of the place can post.
create table if not exists discussion_comments (
  id uuid primary key default gen_random_uuid(),
  scope_kind text not null check (scope_kind in ('meeting', 'body', 'group')),
  scope_id text not null,
  author_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('question', 'information', 'opinion')),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  created_at timestamptz not null default now(),
  constraint discussion_info_needs_source check (kind <> 'information' or source_url <> '')
);
create index if not exists discussion_scope_idx on discussion_comments (scope_kind, scope_id, created_at);
alter table discussion_comments enable row level security;
drop policy if exists discussion_insert on discussion_comments;
create policy discussion_insert on discussion_comments for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and (
      (discussion_comments.scope_kind in ('body', 'group') and exists (
        select 1 from bodies b
        where b.id = discussion_comments.scope_id and b.place_id = any (p.place_ids)))
      or (discussion_comments.scope_kind = 'meeting' and exists (
        select 1 from meetings m
        left join bodies b on b.id = m.body_id
        where m.id = discussion_comments.scope_id
          and coalesce(b.place_id, m.place_id) = any (p.place_ids)))
    )
  )
);

create or replace view discussion_comment_view as
select c.id, c.scope_kind, c.scope_id, c.kind, c.body, c.source_url, c.created_at, p.nickname as author_name
from discussion_comments c
join profiles p on p.id = c.author_id;

-- One feed of recent discussion across items, places, meetings, bodies, and community groups.
create or replace view discussion_feed as
select 'item'::text as scope_kind, c.item_id as scope_id, i.title as title,
       c.kind, c.body, c.source_url, c.author_name, c.created_at
from item_comment_view c join items i on i.id = c.item_id
union all
select 'place', c.place_id, pl.name, c.kind, c.body, c.source_url, c.author_name, c.created_at
from place_comment_view c join places pl on pl.id = c.place_id
union all
select c.scope_kind, c.scope_id, b.name, c.kind, c.body, c.source_url, c.author_name, c.created_at
from discussion_comment_view c join bodies b on b.id = c.scope_id
where c.scope_kind in ('body', 'group')
union all
select 'meeting', c.scope_id, m.title, c.kind, c.body, c.source_url, c.author_name, c.created_at
from discussion_comment_view c join meetings m on m.id = c.scope_id
where c.scope_kind = 'meeting';

revoke all on discussion_comments from anon, authenticated;
grant insert on discussion_comments to authenticated;
grant select on discussion_comment_view, discussion_feed to authenticated;
revoke all on discussion_comment_view, discussion_feed from anon;

-- Fictional congressional and state districts (sample only). Representatives' names stay empty.
insert into places (id, kind, name, parent_id, source_url) values
  ('us-house-sample', 'congressional_district', 'U.S. House, sample district (fictional)', 'county-sd', ''),
  ('state-sample', 'state_district', 'State senate, sample district (fictional)', 'county-sd', '')
on conflict (id) do nothing;

insert into officials (id, place_id, name, role, office_url) values
  ('off-us-house', 'us-house-sample', null, 'U.S. Representative (sample)', ''),
  ('off-state', 'state-sample', null, 'State senator (sample)', '')
on conflict (id) do nothing;

-- Subcommittees under the City Council, and community groups in three sample districts. Sample data.
insert into bodies (id, name, level, district_label, about, source_url, agenda_url, place_id, kind, schedule_text, parent_id) values
  ('sd-council-budget', 'Budget and Government Efficiency Committee (sample)', 'city', '',
   'Reviews the city budget before it goes to the full council.',
   'https://www.sandiego.gov/citycouncil', '', 'city-sd', 'committee', 'Meets on a schedule set by the council (sample).', 'sd-council'),
  ('sd-council-safety', 'Public Safety and Livable Neighborhoods Committee (sample)', 'city', '',
   'Reviews public safety and neighborhood policy before votes.',
   'https://www.sandiego.gov/citycouncil', '', 'city-sd', 'committee', 'Meets on a schedule set by the council (sample).', 'sd-council'),
  ('group-cd1', 'District 1 Neighborhood Council (sample)', 'special', 'District 1 (sample)',
   'A community group, not a government body. Residents discuss local issues and invite speakers.',
   'https://www.sandiego.gov/citycouncil/cd1', '', 'cd1', 'community', 'Meets monthly (sample).', null),
  ('group-cd3', 'District 3 Neighborhood Council (sample)', 'special', 'District 3 (sample)',
   'A community group, not a government body. Residents discuss local issues and invite speakers.',
   'https://www.sandiego.gov/citycouncil/cd3', '', 'cd3', 'community', 'Meets monthly (sample).', null),
  ('group-cd7', 'District 7 Neighborhood Council (sample)', 'special', 'District 7 (sample)',
   'A community group, not a government body. Residents discuss local issues and invite speakers.',
   'https://www.sandiego.gov/citycouncil/cd7', '', 'cd7', 'community', 'Meets monthly (sample).', null)
on conflict (id) do nothing;
