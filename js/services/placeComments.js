// General discussion on a place. Residents of the place can post. The view hides ids and shows nicknames.
import { sb, unwrap } from '../lib/supabase.js';

export async function listPlaceComments(placeId) {
  return unwrap(await sb().from('place_comment_view').select('*')
    .eq('place_id', placeId)
    .order('created_at'))
    .map(r => ({
      id: r.id,
      kind: r.kind,
      body: r.body,
      sourceUrl: r.source_url,
      authorName: r.author_name,
      createdAt: r.created_at,
    }));
}

export async function addPlaceComment({ userId, placeId, kind, body, sourceUrl = '' }) {
  unwrap(await sb().from('place_comments').insert({
    author_id: userId,
    place_id: placeId,
    kind,
    body: body.trim(),
    source_url: sourceUrl.trim(),
  }));
}
