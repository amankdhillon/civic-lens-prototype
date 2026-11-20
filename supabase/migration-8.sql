-- Civic Lens migration 8: indexes for the board reads and the 40-person prototype load.
-- The shell reads every thread and post, newest first, in pages. These indexes keep the sort cheap as boards grow.
-- Run once after seed-sample-prototype.sql. Safe to re-run.

create index if not exists threads_created_idx on discussion_threads (created_at desc, id);
create index if not exists posts_created_idx on discussion_posts (created_at, id);
