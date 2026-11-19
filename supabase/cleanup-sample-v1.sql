-- Removes the first sample data (fictional meetings, agenda items, and threads on them)
-- before loading the city data. Run once in the SQL Editor, then run seed-shell.sql.
-- Safe to re-run.

delete from discussion_threads where scope_kind in ('item', 'meeting');  -- cascades to posts
delete from items where id like 'i-%';
delete from meetings where id ~ '^m[0-9]+$';
delete from bodies where id = 'sdcc-budget';                              -- replaced by cm-budget
