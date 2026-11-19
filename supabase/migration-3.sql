-- Civic Lens migration 3: places (geography), council and school areas, community meetings, and the San Diego sample.
-- Run once in the SQL Editor after migration-2. Safe to re-run where noted.

-- Places: geography. Hierarchy through parent_id (county > city > council district).
create table if not exists places (
  id text primary key,
  kind text not null check (kind in ('county', 'city', 'council_district', 'school_district', 'neighborhood')),
  name text not null,
  parent_id text references places(id),
  boundary_key text not null default '',
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  checked_at date
);

-- Officials for a place. Names stay empty until they're confirmed from the official page.
create table if not exists officials (
  id text primary key,
  place_id text not null references places(id) on delete cascade,
  name text,
  role text not null default '',
  office_url text not null default '' check (office_url = '' or office_url ~ '^https://\S+$'),
  staff_contact text not null default '',
  checked_at date
);

-- A person's places (geography) and bodies (institutions). Bodies also get a place and a kind.
alter table profiles add column if not exists place_ids text[] not null default '{}';
alter table bodies add column if not exists place_id text references places(id);
alter table bodies add column if not exists kind text not null default 'governing'
  check (kind in ('governing', 'board'));
alter table bodies add column if not exists schedule_text text not null default '';

-- Meetings can belong to a body (agenda meetings) or a place (community meetings).
alter table meetings alter column body_id drop not null;
alter table meetings add column if not exists place_id text references places(id);
alter table meetings add column if not exists kind text not null default 'agenda'
  check (kind in ('agenda', 'community'));
alter table meetings add column if not exists details_url text not null default ''
  check (details_url = '' or details_url ~ '^https://\S+$');
alter table meetings drop constraint if exists meetings_owner_check;
alter table meetings add constraint meetings_owner_check
  check (body_id is not null or place_id is not null);

-- The sample bodies that aren't in San Diego: remove them, along with their sample meetings and items.
delete from bodies where id in ('cv-council', 'esc-council', 'suhsd', 'euhsd');

alter table places enable row level security;
alter table officials enable row level security;
drop policy if exists places_read on places;
drop policy if exists officials_read on officials;
create policy places_read on places for select to authenticated using (true);
create policy officials_read on officials for select to authenticated using (true);
grant select on places, officials to authenticated;
revoke all on places, officials from anon;

-- Users set their places along with their bodies.
grant update (nickname, body_ids, place_ids) on profiles to authenticated;
