// All discussions in one place. Each scope (item, place, meeting, body, community group) reads and writes through here.
import { sb, unwrap } from '../lib/supabase.js';
import { listComments, addComment } from './comments.js';
import { listPlaceComments, addPlaceComment } from './placeComments.js';

export const SCOPE_LABEL = {
  item: 'Agenda item',
  meeting: 'Meeting',
  body: 'Government body',
  group: 'Community group',
  place: 'Place',
};

export const scopeHref = (scope, id) => ({
  item: `#/item/${id}`,
  meeting: `#/meeting/${id}`,
  body: `#/body/${id}`,
  group: `#/body/${id}`,
  place: `#/place/${id}`,
}[scope] ?? '#/');

const toComment = r => ({
  id: r.id,
  kind: r.kind,
  body: r.body,
  sourceUrl: r.source_url,
  authorName: r.author_name,
  createdAt: r.created_at,
});

export async function listDiscussion(scope, id) {
  if (scope === 'item') return listComments(id);
  if (scope === 'place') return listPlaceComments(id);
  return unwrap(await sb().from('discussion_comment_view').select('*')
    .eq('scope_kind', scope)
    .eq('scope_id', id)
    .order('created_at'))
    .map(toComment);
}

export async function postDiscussion({ userId, scope, id, kind, body, sourceUrl = '' }) {
  if (scope === 'item') return addComment({ userId, itemId: id, kind, body, sourceUrl });
  if (scope === 'place') return addPlaceComment({ userId, placeId: id, kind, body, sourceUrl });
  unwrap(await sb().from('discussion_comments').insert({
    author_id: userId,
    scope_kind: scope,
    scope_id: id,
    kind,
    body: body.trim(),
    source_url: sourceUrl.trim(),
  }));
}

// Recent activity across every scope, newest first. Used for "Active discussions" on the home screen.
export async function listRecentDiscussions(limit = 8) {
  return unwrap(await sb().from('discussion_feed').select('*')
    .order('created_at', { ascending: false })
    .limit(limit))
    .map(r => ({
      scope: r.scope_kind,
      id: r.scope_id,
      title: r.title,
      kind: r.kind,
      body: r.body,
      sourceUrl: r.source_url,
      authorName: r.author_name,
      createdAt: r.created_at,
    }));
}
