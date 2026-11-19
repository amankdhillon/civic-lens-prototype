// Governing bodies, their meetings, and agenda items. Read-only for visitors.
import { sb, unwrap, AppError } from '../lib/supabase.js';

const safe = u => (/^https:\/\/\S+$/.test(u || '') ? u : '');

const toBody = r => ({
  id: r.id,
  name: r.name,
  level: r.level,
  districtLabel: r.district_label,
  about: r.about,
  sourceUrl: safe(r.source_url),
  agendaUrl: safe(r.agenda_url),
  watchUrl: safe(r.watch_url),
  commentGuide: r.comment_guide ?? '',
  placeId: r.place_id ?? '',
  kind: r.kind ?? 'governing',
  scheduleText: r.schedule_text ?? '',
  parentId: r.parent_id ?? '',
});

const toMeeting = r => ({
  id: r.id,
  bodyId: r.body_id,
  bodyName: r.bodies?.name ?? '',
  level: r.bodies?.level ?? '',
  startsAt: r.starts_at,
  title: r.title,
  location: r.location,
  agendaUrl: safe(r.agenda_url),
  status: r.status,
  items: (r.items ?? []).map(i => ({ id: i.id, title: i.title, stage: i.stage })),
});

export async function listAllBodies() {
  return unwrap(await sb().from('bodies').select('*').order('name')).map(toBody);
}

export async function getBody(id) {
  const row = unwrap(await sb().from('bodies').select('*').eq('id', id).maybeSingle());
  if (!row) throw new AppError('That body could not be found.');
  return toBody(row);
}

// Meetings in progress first, then upcoming ones, soonest first.
export async function listUpcomingMeetings(bodyIds) {
  if (!bodyIds.length) return [];
  const select = '*, bodies(name, level), items(id, title, stage)';
  const [live, upcoming] = await Promise.all([
    sb().from('meetings').select(select).in('body_id', bodyIds).eq('status', 'in_progress'),
    sb().from('meetings').select(select).in('body_id', bodyIds)
      .gte('starts_at', new Date().toISOString()).order('starts_at').limit(60),
  ]);
  const seen = new Map();
  for (const row of [...unwrap(live), ...unwrap(upcoming)]) seen.set(row.id, row);
  return [...seen.values()].map(toMeeting);
}

// Every meeting for one body, newest first.
export async function listMeetingsFor(bodyId) {
  const rows = unwrap(await sb().from('meetings')
    .select('*, bodies(name, level), items(id, title, stage)')
    .eq('body_id', bodyId)
    .order('starts_at', { ascending: false })
    .limit(100));
  return rows.map(toMeeting);
}

export async function getItem(id) {
  const row = unwrap(await sb().from('items')
    .select('*, decided:bodies!decided_by_body_id(name), meetings(id, starts_at, title, location, agenda_url, body_id, bodies(id, name, level, district_label, watch_url, comment_guide, place_id))')
    .eq('id', id)
    .maybeSingle());
  if (!row) return null;
  const m = row.meetings;
  const b = m.bodies;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    whatItDecides: row.what_it_decides,
    whoItAffects: row.who_it_affects,
    stage: row.stage,
    outcome: row.outcome,
    stageBasis: row.stage_basis,
    commentDeadline: row.comment_deadline,
    sourceUrl: safe(row.source_url),
    decidedBy: row.decided?.name ?? '',
    approvalPath: row.approval_path ?? [],
    verifiedAt: row.verified_at,
    meeting: {
      id: m.id,
      startsAt: m.starts_at,
      title: m.title,
      location: m.location,
      bodyId: b.id,
      bodyName: b.name,
      level: b.level,
      districtLabel: b.district_label,
      watchUrl: safe(b.watch_url),
      commentGuide: b.comment_guide ?? '',
      placeId: b.place_id ?? '',
    },
  };
}

// Meetings by id, soonest first. Used for the calendar and for pinned meetings.
export async function listMeetingsByIds(ids) {
  if (!ids.length) return [];
  const rows = unwrap(await sb().from('meetings')
    .select('*, bodies(name, level), items(id, title, stage)')
    .in('id', ids)
    .order('starts_at'));
  return rows.map(toMeeting);
}

// Bodies by id. Used by screens that already know which bodies they need.
export async function listBodiesByIds(ids) {
  if (!ids.length) return [];
  return unwrap(await sb().from('bodies').select('*').in('id', ids).order('name')).map(toBody);
}

// Bodies that belong to one place (the city, the county, a school area).
export async function listBodiesForPlace(placeId) {
  return unwrap(await sb().from('bodies').select('*').eq('place_id', placeId).order('name')).map(toBody);
}

// Subcommittees of one body.
export async function listSubBodies(parentId) {
  return unwrap(await sb().from('bodies').select('*').eq('parent_id', parentId).order('name')).map(toBody);
}

// One meeting with its body and agenda items.
export async function getMeeting(id) {
  const row = unwrap(await sb().from('meetings')
    .select('*, bodies(id, name, level, place_id), items(id, title, stage, outcome)')
    .eq('id', id)
    .maybeSingle());
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    location: row.location,
    status: row.status,
    detailsUrl: safe(row.details_url),
    agendaUrl: safe(row.agenda_url),
    bodyId: row.body_id ?? '',
    bodyName: row.bodies?.name ?? '',
    level: row.bodies?.level ?? '',
    placeId: row.bodies?.place_id ?? row.place_id ?? '',
    items: (row.items ?? []).map(i => ({ id: i.id, title: i.title, stage: i.stage, outcome: i.outcome })),
  };
}
