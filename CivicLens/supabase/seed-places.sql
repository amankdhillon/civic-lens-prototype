-- San Diego sample for the barebones prototype.
-- Verified against sandiego.gov: nine council districts, and the three board entries below (names, meeting-schedule wording, duties page).
-- NOT verified: boundaries, school-area boundaries, community meeting details, and the council members' names (left empty).
-- Replace the community meetings with real ones before any test.

insert into places (id, kind, name, parent_id, source_url) values
  ('county-sd', 'county', 'County of San Diego', null, 'https://www.sandiegocounty.gov/departments/'),
  ('city-sd', 'city', 'City of San Diego', 'county-sd', 'https://www.sandiego.gov/'),
  ('cd1', 'council_district', 'City Council District 1', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd1'),
  ('cd2', 'council_district', 'City Council District 2', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd2'),
  ('cd3', 'council_district', 'City Council District 3', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd3'),
  ('cd4', 'council_district', 'City Council District 4', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd4'),
  ('cd5', 'council_district', 'City Council District 5', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd5'),
  ('cd6', 'council_district', 'City Council District 6', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd6'),
  ('cd7', 'council_district', 'City Council District 7', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd7'),
  ('cd8', 'council_district', 'City Council District 8', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd8'),
  ('cd9', 'council_district', 'City Council District 9', 'city-sd', 'https://www.sandiego.gov/citycouncil/cd9'),
  ('sdusd', 'school_district', 'San Diego Unified School District (sample area)', 'county-sd', 'https://www.sandiegounified.org/about/board_of_education')
on conflict (id) do nothing;

-- Officials: one per council district, name empty until confirmed.
insert into officials (id, place_id, name, role, office_url) values
  ('off-cd1', 'cd1', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd1'),
  ('off-cd2', 'cd2', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd2'),
  ('off-cd3', 'cd3', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd3'),
  ('off-cd4', 'cd4', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd4'),
  ('off-cd5', 'cd5', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd5'),
  ('off-cd6', 'cd6', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd6'),
  ('off-cd7', 'cd7', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd7'),
  ('off-cd8', 'cd8', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd8'),
  ('off-cd9', 'cd9', null, 'Council member', 'https://www.sandiego.gov/citycouncil/cd9')
on conflict (id) do nothing;

-- Bodies. Existing sample ids are re-pointed to their real places.
insert into bodies (id, name, level, district_label, about, source_url, agenda_url, place_id, kind, schedule_text) values
  ('bos', 'Board of Supervisors, County of San Diego', 'county', '', 'Elected supervisors set the county budget and run county services.',
   'https://www.sandiegocounty.gov/departments/', '', 'county-sd', 'governing', ''),
  ('sd-council', 'City Council, City of San Diego', 'city', '', 'Nine elected council members. Each represents one council district. The council sets the city budget and passes ordinances.',
   'https://www.sandiego.gov/citycouncil', '', 'city-sd', 'governing', ''),
  ('sdusd', 'San Diego Unified School District Board of Education', 'school', '', 'Elected trustees set district policy and budget.',
   'https://www.sandiegounified.org/about/board_of_education', '', 'sdusd', 'governing', '')
on conflict (id) do update set place_id = excluded.place_id, name = excluded.name, about = excluded.about,
  source_url = excluded.source_url, kind = excluded.kind;

-- Optional city boards. People choose these; they aren't joined by location.
insert into bodies (id, name, level, district_label, about, source_url, agenda_url, place_id, kind, schedule_text) values
  ('board-accessibility', 'Accessibility Advisory Board', 'city', '', 'Advises the city on accessibility.',
   'https://www.sandiego.gov/boards-and-commissions/list', 'https://www.sandiego.gov/adacompliance/aab', 'city-sd', 'board',
   'Typically meets monthly on the fourth Thursday, 2 to 3:30 p.m., at Civic Center Plaza.'),
  ('board-climate', 'Climate Advisory Board', 'city', '', 'Advises the city on climate action.',
   'https://www.sandiego.gov/boards-and-commissions/list', 'https://www.sandiego.gov/planning/public-hearings-meetings/climate-advisory-board', 'city-sd', 'board',
   'Generally meets monthly, but the schedule may vary at the Chair''s discretion.'),
  ('board-cpp', 'Commission on Police Practices', 'city', '', 'Oversees police practices and complaints.',
   'https://www.sandiego.gov/boards-and-commissions/list', 'https://www.sandiego.gov/cpp/meetingsagendas', 'city-sd', 'board',
   'Regular business meetings on the first Wednesday of the month, 5 to 8 p.m.')
on conflict (id) do nothing;

-- Community meetings for three sample districts. These are placeholders, not real events.
insert into meetings (id, place_id, kind, starts_at, title, location, details_url, status) values
  ('cm-cd1-1', 'cd1', 'community', '2026-12-03T18:00:00-08:00', 'Community meeting (sample)', 'Sample library', 'https://example.org/sign-up', 'scheduled'),
  ('cm-cd1-2', 'cd1', 'community', '2026-12-17T18:00:00-08:00', 'Neighborhood forum (sample)', 'Sample recreation center', 'https://example.org/sign-up', 'scheduled'),
  ('cm-cd3-1', 'cd3', 'community', '2026-12-05T18:30:00-08:00', 'Community meeting (sample)', 'Sample church hall', 'https://example.org/sign-up', 'scheduled'),
  ('cm-cd3-2', 'cd3', 'community', '2026-12-12T18:30:00-08:00', 'Park planning session (sample)', 'Sample park', 'https://example.org/sign-up', 'scheduled'),
  ('cm-cd7-1', 'cd7', 'community', '2026-12-09T17:30:00-08:00', 'Community meeting (sample)', 'Sample school gym', 'https://example.org/sign-up', 'scheduled'),
  ('cm-cd7-2', 'cd7', 'community', '2026-12-16T17:30:00-08:00', 'Transit and streets forum (sample)', 'Sample community center', 'https://example.org/sign-up', 'scheduled')
on conflict (id) do nothing;
