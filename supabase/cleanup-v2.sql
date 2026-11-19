-- Removes the bodies the prototype no longer shows (committees, boards, the School Board, federal and state placeholders,
-- and community groups) and their meetings and group discussions. Run once in the SQL Editor after the earlier seeds.
-- Safe to re-run.

delete from discussion_threads where scope_kind = 'group';
delete from meetings where body_id not in ('sdcc', 'bos');
delete from bodies where parent_id is not null;
delete from bodies where id not in ('sdcc', 'bos');
