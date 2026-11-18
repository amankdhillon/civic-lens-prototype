// Places (county, city, council district, school area), their officials, and community meetings.
import { sb, unwrap, AppError } from '../lib/supabase.js';

const safe = u => (/^https:\/\/\S+$/.test(u || '') ? u : '');

export const toPlace = r => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  parentId: r.parent_id ?? '',
  sourceUrl: safe(r.source_url),
});

export async function getPlace(id) {
  const row = unwrap(await sb().from('places').select('*').eq('id', id).maybeSingle());
  if (!row) throw new AppError('That place could not be found.');
  return toPlace(row);
}

export async function listPlaces(ids) {
  if (!ids.length) return [];
  return unwrap(await sb().from('places').select('*').in('id', ids)).map(toPlace);
}

export async function listOfficials(placeId) {
  return unwrap(await sb().from('officials').select('*').eq('place_id', placeId)).map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    officeUrl: safe(r.office_url),
    staffContact: r.staff_contact,
  }));
}

// Community meetings for a place, soonest first. Agenda meetings have no place_id, so they're excluded.
export async function listCommunityMeetings(placeId) {
  return unwrap(await sb().from('meetings').select('*')
    .eq('place_id', placeId)
    .eq('kind', 'community')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(10))
    .map(r => ({
      id: r.id,
      title: r.title,
      startsAt: r.starts_at,
      location: r.location,
      detailsUrl: safe(r.details_url),
    }));
}

// The sample pins. Each pin lists the places it falls in. Address lookup replaces this once boundaries are loaded.
export async function loadDemoPins() {
  const res = await fetch('data/demo-locations.json');
  if (!res.ok) throw new AppError('The sample locations could not be loaded.');
  return (await res.json()).pins;
}
