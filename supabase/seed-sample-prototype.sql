-- Civic Lens: SAMPLE prototype data (fictional). Run after migration-7.sql and seed-shell.sql.
-- Every record is marked as sample. No real officials, residents, addresses, or phone numbers.
-- Agenda items and summaries are written for the demo and must not be read as official records.
-- Idempotent: every insert uses on conflict do nothing, and the one update only changes a status once.
-- Timestamps are Pacific time. Past meetings are before 2026-11-19; upcoming meetings are after.

-- Officials: one placeholder row per district (names are placeholders, not real people).
insert into officials (id, place_id, name, role, office_url) values
  ('off-sample-sdcc-1', 'sdcc-1', 'Sample representative, District 1', 'Sample role', ''),
  ('off-sample-sdcc-2', 'sdcc-2', 'Sample representative, District 2', 'Sample role', ''),
  ('off-sample-sdcc-3', 'sdcc-3', 'Sample representative, District 3', 'Sample role', ''),
  ('off-sample-sdcc-4', 'sdcc-4', 'Sample representative, District 4', 'Sample role', ''),
  ('off-sample-sdcc-5', 'sdcc-5', 'Sample representative, District 5', 'Sample role', ''),
  ('off-sample-sdcc-6', 'sdcc-6', 'Sample representative, District 6', 'Sample role', ''),
  ('off-sample-sdcc-7', 'sdcc-7', 'Sample representative, District 7', 'Sample role', ''),
  ('off-sample-sdcc-8', 'sdcc-8', 'Sample representative, District 8', 'Sample role', ''),
  ('off-sample-sdcc-9', 'sdcc-9', 'Sample representative, District 9', 'Sample role', ''),
  ('off-sample-bos-1', 'bos-1', 'Sample supervisor, District 1', 'Sample role', ''),
  ('off-sample-bos-2', 'bos-2', 'Sample supervisor, District 2', 'Sample role', ''),
  ('off-sample-bos-3', 'bos-3', 'Sample supervisor, District 3', 'Sample role', ''),
  ('off-sample-bos-4', 'bos-4', 'Sample supervisor, District 4', 'Sample role', ''),
  ('off-sample-bos-5', 'bos-5', 'Sample supervisor, District 5', 'Sample role', ''),
  ('off-sample-sdusd-a', 'sdusd-a', 'Sample board member, Area A', 'Sample role', ''),
  ('off-sample-sdusd-b', 'sdusd-b', 'Sample board member, Area B', 'Sample role', ''),
  ('off-sample-sdusd-c', 'sdusd-c', 'Sample board member, Area C', 'Sample role', ''),
  ('off-sample-sdusd-d', 'sdusd-d', 'Sample board member, Area D', 'Sample role', ''),
  ('off-sample-sdusd-e', 'sdusd-e', 'Sample board member, Area E', 'Sample role', ''),
  ('off-sample-fed-sd', 'fed-sd', 'Sample representative, U.S. House (sample district)', 'Sample role', ''),
  ('off-sample-state-sd', 'state-sd', 'Sample senator, State Senate (sample district)', 'Sample role', '')
on conflict (id) do nothing;

-- Meetings: two new upcoming or past meetings per body that needed them, so each body has 2 to 3 meetings.
insert into meetings (id, body_id, starts_at, title, location, status) values
  ('sample-sdcc-2026-11-24', 'sdcc', '2026-11-24 14:00:00-08', 'Regular meeting', 'Sample location', 'scheduled'),
  ('sample-bos-2026-12-15', 'bos', '2026-12-15 09:00:00-08', 'Regular meeting', 'Sample location', 'scheduled'),
  ('sample-cpg-2026-10-15', 'cpg-uptown', '2026-10-15 18:00:00-07', 'Regular meeting', 'Sample location', 'held'),
  ('sample-cpg-2026-12-03', 'cpg-uptown', '2026-12-03 18:00:00-08', 'Regular meeting', 'Sample location', 'scheduled')
on conflict (id) do nothing;

-- Meetings that have already happened are marked held. Only changes rows still marked scheduled.
update meetings set status = 'held'
  where id in ('cal-2026-11-10-council-pm', 'cal-2026-11-17-bos') and status = 'scheduled';

-- Agenda items for the meetings the app already lists (ids match js/shell/city-data.js).
-- Only decided items carry an outcome. Advisory items with a "Received" result are information_only.
insert into items (id, meeting_id, title, summary, what_it_decides, who_it_affects, stage, outcome, stage_basis, source_url) values
  ('it-1110-2', 'cal-2026-11-10-council-pm', 'Budget amendment: move reserves to road and sidewalk repair',
   'Sample summary: moves $18 million from reserves to road and sidewalk repair.',
   'Whether $18 million moves from reserves to road and sidewalk repair.',
   'Anyone who depends on road and sidewalk repair.', 'decided', 'Adopted, 6-3', 'agenda', ''),
  ('it-1110-3', 'cal-2026-11-10-council-pm', 'Short-term rental permit enforcement update',
   'Sample summary: informational report on complaints, inspections, and permit revocations citywide.',
   'Nothing final. The report is received for information.',
   'Neighbors of short-term rentals.', 'information_only', '', 'agenda', ''),
  ('it-1117b-1', 'cal-2026-11-17-bos', 'Winter shelter capacity contract, 2026-27 season',
   'Sample summary: adds 600 winter shelter beds across county-contracted sites.',
   'Whether the county adds 600 winter beds under a contract.',
   'People without shelter this winter.', 'decided', 'Approved, 5-0', 'agenda', ''),
  ('it-1117b-2', 'cal-2026-11-17-bos', 'Regional parks and trails maintenance report',
   'Sample summary: annual maintenance backlog report with a list of trails scheduled for repair.',
   'Nothing final. The report is received for information.',
   'People who use county trails.', 'information_only', '', 'agenda', ''),
  ('it-1119-1', 'cal-2026-11-19-cpg', 'Park Boulevard corridor plan: presentation',
   'Sample summary: staff presents the corridor plan for bike lanes, crossings, and parking changes, and asks for comments.',
   'Nothing final. Comments go to the City with the plan.',
   'Cyclists, drivers, and businesses on Park Boulevard.', 'information_only', '', 'agenda', ''),
  ('it-1119-2', 'cal-2026-11-19-cpg', 'Short-term rental complaints report',
   'Sample summary: code enforcement report on complaints in the planning area over the last quarter.',
   'Nothing final. The planning group reviews the report.',
   'Neighbors of short-term rentals.', 'information_only', '', 'agenda', ''),
  ('it-1119-3', 'cal-2026-11-19-cpg', 'Officer elections',
   'Sample summary: election of chair and vice chair for the coming year.',
   'Who chairs and speaks for the planning group next year.',
   'Planning group members.', 'vote', '', 'agenda', ''),
  ('it-1201-1', 'cal-2026-12-01-council-pm', 'Council public comment rules (continued from Nov 16)',
   'Sample summary: second reading of speaking time rules, two minutes for general comment and three minutes for scheduled items.',
   'The speaking time limits at future council meetings.',
   'Everyone who wants to speak at council meetings.', 'vote', '', 'agenda', ''),
  ('it-1201-2', 'cal-2026-12-01-council-pm', 'Traffic calming, 30th Street between Upas and University',
   'Sample summary: approves the design and $1.1 million for speed humps, a crossing signal, and a pilot bike lane.',
   'Design and funding for traffic calming on 30th Street.',
   'Drivers, people walking, and bike riders on 30th Street.', 'vote', '', 'agenda', ''),
  ('it-1201-3', 'cal-2026-12-01-council-pm', 'Outreach funding for recognized community planning groups',
   'Sample summary: proposes annual outreach funding for planning groups, including translation support.',
   'Whether to fund outreach for recognized planning groups.',
   'Community planning groups and their neighbors.', 'introduced', '', 'agenda', ''),
  ('it-1208-1', 'cal-2026-12-08-bos', 'Six-month transit fare pilot on County routes',
   'Sample summary: proposes reduced fares for youth and seniors on county-operated routes for six months.',
   'Whether a six-month reduced fare pilot runs on county routes.',
   'Youth and seniors who ride county routes.', 'vote', '', 'agenda', ''),
  ('it-1208-2', 'cal-2026-12-08-bos', 'Emergency medical services contract renewal',
   'Sample summary: renews the ambulance services contract for three years with a new response-time standard.',
   'The ambulance services contract and its response-time standard.',
   'Anyone who calls for an ambulance.', 'vote', '', 'agenda', '')
on conflict (id) do nothing;

-- Agenda items for the new sample meetings above. Each links to the example placeholder page.
insert into items (id, meeting_id, title, summary, what_it_decides, who_it_affects, stage, outcome, stage_basis, source_url) values
  ('sample-item-sdcc-1124-1', 'sample-sdcc-2026-11-24', 'Sample: Street tree maintenance contract',
   'Sample summary: renews a contract for trimming street trees in three districts.',
   'Whether the city renews the tree trimming contract for three years.',
   'Residents with street trees on their block.', 'vote', '', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-sdcc-1124-2', 'sample-sdcc-2026-11-24', 'Sample: Recycling pickup schedule change',
   'Sample summary: staff proposes moving holiday recycling pickup one day later.',
   'Whether holiday recycling pickup moves one day later.',
   'Households on the city recycling route.', 'introduced', '', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-bos-1215-1', 'sample-bos-2026-12-15', 'Sample: Library hours pilot',
   'Sample summary: proposes extended weekend library hours at three county branches for one year.',
   'Whether a one-year weekend hours pilot runs at three county libraries.',
   'Library users in the pilot areas.', 'vote', '', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-bos-1215-2', 'sample-bos-2026-12-15', 'Sample: Annual fire response time report',
   'Sample summary: a report on response times in unincorporated areas for the past year.',
   'Nothing final. The report is received for information.',
   'Residents in unincorporated areas.', 'information_only', '', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-cpg-1015-1', 'sample-cpg-2026-10-15', 'Sample: Traffic calming survey results',
   'Sample summary: a survey of residents on speed and crossings, sent to city staff.',
   'Nothing final. The group forwards the results to city staff.',
   'Residents on the surveyed blocks.', 'decided', 'Sample outcome: forwarded to city staff', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-cpg-1015-2', 'sample-cpg-2026-10-15', 'Sample: Officer nominations',
   'Sample summary: members nominate candidates for chair and vice chair.',
   'Who runs for planning group officer in the coming year.',
   'Planning group members.', 'decided', 'Sample outcome: nominations accepted', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-cpg-1203-1', 'sample-cpg-2026-12-03', 'Sample: Community garden lease',
   'Sample summary: proposes a lease renewal for a community garden on a city site.',
   'Whether the group supports the garden lease renewal.',
   'Gardeners and neighbors near the site.', 'vote', '', 'agenda', 'https://example.com/sample-item'),
  ('sample-item-cpg-1203-2', 'sample-cpg-2026-12-03', 'Sample: Holiday event planning',
   'Sample summary: members plan a neighborhood holiday event for the group.',
   'Nothing final. Members agree on the event plan.',
   'Neighbors who attend the event.', 'introduced', '', 'agenda', 'https://example.com/sample-item')
on conflict (id) do nothing;

-- Discussion threads. Information threads carry their https source link in the first post,
-- because discussion_threads has no source column. Every author here is a sample name with no account.

-- Topic boards (5 citywide topics: streets, housing, budget, safety, schools)
insert into discussion_threads (id, scope_kind, scope_id, title, kind, author_name, created_at) values
  ('a1000000-0000-4000-8000-000000000001', 'topic', 'streets', 'Sample: Will the 30th Street speed humps be built before summer', 'question', 'Sample resident A', '2026-11-18T09:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000002', 'topic', 'streets', 'Sample: How to read a staff repaving list', 'information', 'Sample resident C', '2026-11-17T12:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000003', 'topic', 'housing', 'Sample: Should alley-facing units get a second story', 'opinion', 'Sample resident B', '2026-11-16T10:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000004', 'topic', 'budget', 'Sample: Where the reserves figures come from', 'information', 'Sample resident A', '2026-11-16T09:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000005', 'topic', 'safety', 'Sample: Do community safety walks make a difference', 'question', 'Sample resident E', '2026-11-15T18:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000006', 'topic', 'schools', 'Sample: Crossing guard training should be shared', 'opinion', 'Sample resident C', '2026-11-14T16:00:00-08:00')
on conflict (id) do nothing;

insert into discussion_posts (id, thread_id, author_name, body, created_at) values
  ('b1000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000001', 'Sample resident A', 'Sample post: the December 1 item approves design and funding. Does construction start before summer?', '2026-11-18T09:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000102', 'a1000000-0000-4000-8000-000000000001', 'Sample resident B', 'Sample post: the summary does not give a schedule. Check the item page once the staff report posts.', '2026-11-18T10:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000002', 'Sample resident C', 'Sample guide: a staff list usually shows street name, limits, and planned year. Example reference: https://example.com/sample-repaving-guide', '2026-11-17T12:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000202', 'a1000000-0000-4000-8000-000000000002', 'Sample resident A', 'Sample reply: the limits column tells you whether your block is included.', '2026-11-17T15:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000003', 'Sample resident B', 'Sample opinion: alley units can add homes without changing street frontage. Height limits still matter.', '2026-11-16T10:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000003', 'Sample resident C', 'Sample opinion: I would want shade and privacy rules first.', '2026-11-16T13:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000401', 'a1000000-0000-4000-8000-000000000004', 'Sample resident A', 'Sample guide: reserve totals appear in the budget summary. Example link: https://example.com/sample-budget-summary', '2026-11-16T09:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000402', 'a1000000-0000-4000-8000-000000000004', 'Sample resident D', 'Sample reply: the summary table lists the policy minimum next to the balance.', '2026-11-16T11:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000501', 'a1000000-0000-4000-8000-000000000005', 'Sample resident E', 'Sample question: has anyone attended a walk that led to a fix on their street?', '2026-11-15T18:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000502', 'a1000000-0000-4000-8000-000000000005', 'Sample resident B', 'Sample reply: yes, a light repair followed our walk. It took about two months.', '2026-11-15T20:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000601', 'a1000000-0000-4000-8000-000000000006', 'Sample resident C', 'Sample opinion: schools and the city should share crossing guard training materials.', '2026-11-14T16:00:00-08:00')
on conflict (id) do nothing;

-- Body boards (county, city, planning group)
insert into discussion_threads (id, scope_kind, scope_id, title, kind, author_name, created_at) values
  ('a1000000-0000-4000-8000-000000000007', 'body', 'bos', 'Sample: Where to find the county meeting calendar', 'information', 'Sample resident D', '2026-11-17T08:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000008', 'body', 'bos', 'Sample: Should consent items be pulled more often', 'opinion', 'Sample resident E', '2026-11-15T11:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000009', 'body', 'sdcc', 'Sample: How early should I arrive for a council item', 'question', 'Sample resident A', '2026-11-16T12:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000010', 'body', 'cpg-uptown', 'Sample: Park Boulevard plan documents', 'information', 'Sample resident D', '2026-11-18T14:00:00-08:00')
on conflict (id) do nothing;

insert into discussion_posts (id, thread_id, author_name, body, created_at) values
  ('b1000000-0000-4000-8000-000000000701', 'a1000000-0000-4000-8000-000000000007', 'Sample resident D', 'Sample guide: the Board calendar and agenda documents are on the county site. Example link: https://example.com/sample-bos-calendar', '2026-11-17T08:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000702', 'a1000000-0000-4000-8000-000000000007', 'Sample resident A', 'Sample reply: thanks. I also check the agenda packet for attachments.', '2026-11-17T10:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000801', 'a1000000-0000-4000-8000-000000000008', 'Sample resident E', 'Sample opinion: consent items are routine, but a quick pull for public comment would help residents follow along.', '2026-11-15T11:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000802', 'a1000000-0000-4000-8000-000000000008', 'Sample resident B', 'Sample opinion: pulling items takes time. Maybe flag the three largest consent items each week.', '2026-11-15T14:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000803', 'a1000000-0000-4000-8000-000000000008', 'Sample resident E', 'Sample reply: flagging by dollar amount sounds fair.', '2026-11-15T16:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000901', 'a1000000-0000-4000-8000-000000000009', 'Sample resident A', 'Sample question: if I want to speak on a Tuesday item, when should I sign up?', '2026-11-16T12:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000000902', 'a1000000-0000-4000-8000-000000000009', 'Sample resident C', 'Sample reply: sign up before the item is called. Ask the clerk about the order of items.', '2026-11-16T15:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001001', 'a1000000-0000-4000-8000-000000000010', 'Sample resident D', 'Sample guide: the plan packet should include maps and a summary. Example link: https://example.com/sample-park-blvd-plan', '2026-11-18T14:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001002', 'a1000000-0000-4000-8000-000000000010', 'Sample resident B', 'Sample reply: I will read the summary before the meeting.', '2026-11-18T16:00:00-08:00')
on conflict (id) do nothing;

-- District boards (sample district boards for District 5 of the city and District 3 of the county)
insert into discussion_threads (id, scope_kind, scope_id, title, kind, author_name, created_at) values
  ('a1000000-0000-4000-8000-000000000011', 'place', 'sdcc-5', 'Sample: Who is organizing the District 5 cleanup', 'question', 'Sample resident E', '2026-11-17T09:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000012', 'place', 'sdcc-5', 'Sample: A crosswalk on Fir Street', 'opinion', 'Sample resident C', '2026-11-15T15:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000013', 'place', 'bos-3', 'Sample: Library weekend hours in our area', 'question', 'Sample resident B', '2026-11-16T17:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000014', 'place', 'bos-3', 'Sample: Shelter beds in District 3', 'information', 'Sample resident A', '2026-11-17T13:00:00-08:00')
on conflict (id) do nothing;

insert into discussion_posts (id, thread_id, author_name, body, created_at) values
  ('b1000000-0000-4000-8000-000000001101', 'a1000000-0000-4000-8000-000000000011', 'Sample resident E', 'Sample question: is there a cleanup date set for the Fir Street blocks?', '2026-11-17T09:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001102', 'a1000000-0000-4000-8000-000000000011', 'Sample resident A', 'Sample reply: a date is posted on the group page. I will check and post it here.', '2026-11-17T11:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001201', 'a1000000-0000-4000-8000-000000000012', 'Sample resident C', 'Sample opinion: a marked crosswalk near the school would help kids cross safely.', '2026-11-15T15:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001202', 'a1000000-0000-4000-8000-000000000012', 'Sample resident E', 'Sample opinion: agreed. A flashing sign would help drivers slow down.', '2026-11-15T18:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001301', 'a1000000-0000-4000-8000-000000000013', 'Sample resident B', 'Sample question: are weekend hours coming back at the branch near us?', '2026-11-16T17:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001302', 'a1000000-0000-4000-8000-000000000013', 'Sample resident D', 'Sample reply: the sample library pilot item on December 15 would test this. Check the agenda when it posts.', '2026-11-17T08:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001401', 'a1000000-0000-4000-8000-000000000014', 'Sample resident A', 'Sample guide: the winter shelter contract lists total beds. Example: https://example.com/sample-shelter-summary', '2026-11-17T13:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001402', 'a1000000-0000-4000-8000-000000000014', 'Sample resident C', 'Sample reply: the summary does not list district locations, so that is still open.', '2026-11-17T16:00:00-08:00')
on conflict (id) do nothing;

-- Meeting boards (one for a past county meeting, one for the planning group meeting on 2026-11-19)
insert into discussion_threads (id, scope_kind, scope_id, title, kind, author_name, created_at) values
  ('a1000000-0000-4000-8000-000000000015', 'meeting', 'cal-2026-11-17-bos', 'Sample: Did the shelter contract include new sites', 'question', 'Sample resident D', '2026-11-17T16:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000016', 'meeting', 'cal-2026-11-19-cpg', 'Sample: What to ask before the Park Boulevard item', 'opinion', 'Sample resident E', '2026-11-18T19:00:00-08:00')
on conflict (id) do nothing;

insert into discussion_posts (id, thread_id, author_name, body, created_at) values
  ('b1000000-0000-4000-8000-000000001501', 'a1000000-0000-4000-8000-000000000015', 'Sample resident D', 'Sample question: the approved contract lists 600 beds. Are any new sites in District 3?', '2026-11-17T16:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001502', 'a1000000-0000-4000-8000-000000000015', 'Sample resident A', 'Sample reply: the sample summary does not say. I will look for the attachment.', '2026-11-17T18:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001601', 'a1000000-0000-4000-8000-000000000016', 'Sample resident E', 'Sample opinion: ask about parking loss first, then the construction schedule.', '2026-11-18T19:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001602', 'a1000000-0000-4000-8000-000000000016', 'Sample resident B', 'Sample opinion: also ask how the group will take written comments on the plan.', '2026-11-18T20:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001603', 'a1000000-0000-4000-8000-000000000016', 'Sample resident D', 'Sample reply: good list. I will bring it to the meeting.', '2026-11-18T21:00:00-08:00')
on conflict (id) do nothing;

-- Item boards (one per item type: a question, an information thread, and an opinion thread)
insert into discussion_threads (id, scope_kind, scope_id, title, kind, author_name, created_at) values
  ('a1000000-0000-4000-8000-000000000017', 'item', 'it-1117b-2', 'Sample: Which trail is scheduled first', 'question', 'Sample resident C', '2026-11-18T11:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000018', 'item', 'it-1119-1', 'Sample: Plain explanation of the Park Boulevard plan', 'information', 'Sample resident B', '2026-11-18T15:00:00-08:00'),
  ('a1000000-0000-4000-8000-000000000019', 'item', 'it-1110-2', 'Sample: Reserves move: is this a good use?', 'opinion', 'Sample resident F', '2026-11-10T18:00:00-08:00')
on conflict (id) do nothing;

insert into discussion_posts (id, thread_id, author_name, body, created_at) values
  ('b1000000-0000-4000-8000-000000001701', 'a1000000-0000-4000-8000-000000000017', 'Sample resident C', 'Sample question: does the backlog report rank trails by repair date?', '2026-11-18T11:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001702', 'a1000000-0000-4000-8000-000000000017', 'Sample resident A', 'Sample reply: the sample report lists trails in order of scheduled repair. Check the attachment for dates.', '2026-11-18T13:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001801', 'a1000000-0000-4000-8000-000000000018', 'Sample resident B', 'Sample guide: the plan would change bike lanes, crossings, and parking. Example link: https://example.com/sample-park-plan-summary', '2026-11-18T15:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001901', 'a1000000-0000-4000-8000-000000000019', 'Sample resident F', 'Sample opinion: moving reserves to roads makes sense if the amount is one-time.', '2026-11-10T18:00:00-08:00'),
  ('b1000000-0000-4000-8000-000000001902', 'a1000000-0000-4000-8000-000000000019', 'Sample resident G', 'Sample reply: staff says it is one-time, but the reserve target still needs watching.', '2026-11-11T09:00:00-08:00')
on conflict (id) do nothing;

-- Saved items (favorites) are per person, so this file adds none.

-- ===== VERIFICATION QUERIES (run one at a time after the file; each should return the result described) =====
-- Row counts per table:
--   select 'officials' t, count(*) from officials union all select 'meetings', count(*) from meetings
--   union all select 'items', count(*) from items union all select 'discussion_threads', count(*) from discussion_threads
--   union all select 'discussion_posts', count(*) from discussion_posts union all select 'body_places', count(*) from body_places;
-- Districts with no official (expect no rows):
--   select p.id from places p where p.kind in ('council_district','county','school_district','congressional_district','state_district')
--   and not exists (select 1 from officials o where o.place_id = p.id);
-- Bodies with no places (expect no rows except cpg-uptown, which is linked through its own place):
--   select b.id from bodies b where not exists (select 1 from body_places bp where bp.body_id = b.id);
--   (cpg-uptown links to its own place cpg-uptown in seed-shell.sql, so it should not appear.)
-- Threads with no posts (expect no rows):
--   select t.id, t.title from discussion_threads t where not exists (select 1 from discussion_posts p where p.thread_id = t.id);
-- Meetings with no items (expect no rows for meetings the app lists):
--   select m.id from meetings m where not exists (select 1 from items i where i.meeting_id = m.id);
-- JS item ids missing from the items table (expect no rows):
--   select unnest(array['it-1110-2','it-1110-3','it-1117b-1','it-1117b-2','it-1119-1','it-1119-2','it-1119-3',
--   'it-1201-1','it-1201-2','it-1201-3','it-1208-1','it-1208-2']) as id except select id from items;
