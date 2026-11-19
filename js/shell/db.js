// Database access for the prototype shell (phase 2). Classic script; loads after the supabase-js build in index.html.
// The URL and publishable key match js/config.js. The publishable key is public; row-level security protects the data.
const SHELL_SUPABASE_URL = 'https://rvqfgwidcjhfmowxekkh.supabase.co';
const SHELL_SUPABASE_KEY = 'sb_publishable_TduPKAxZQRMOfqHioIEnrw_4HwD1Mra';
const db = supabase.createClient(SHELL_SUPABASE_URL, SHELL_SUPABASE_KEY, {
  // Single-tab prototype: skip the cross-tab auth lock (same choice as js/lib/supabase.js).
  auth: { lock: async (_name, _timeout, fn) => fn() },
});

function uuid4() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function dbFail(error) {
  const msg = error?.message || 'Database error.';
  if (msg.includes('Anonymous')) throw new Error('Anonymous sign-ins are off. Turn them on in Supabase: Authentication > Sign In / Providers.');
  if (msg.includes('row-level security')) throw new Error("That isn't allowed from this account. Check that your districts cover this board.");
  if (msg.includes('Failed to fetch')) throw new Error('Cannot reach Supabase. Check your internet connection.');
  throw new Error(msg);
}

// Starts an anonymous session if needed, then returns this person's profile (or null if none yet).
async function dbStart() {
  const { data: s } = await db.auth.getSession();
  if (!s.session) {
    const r = await db.auth.signInAnonymously();
    if (r.error) dbFail(r.error);
  }
  const { data: u } = await db.auth.getUser();
  if (!u?.user) return null;
  const { data: row, error } = await db.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
  if (error) dbFail(error);
  return row ? { id: row.id, nickname: row.nickname, placeIds: row.place_ids ?? [] } : null;
}

async function dbCreateProfile(nickname) {
  const { data: u } = await db.auth.getUser();
  if (!u?.user) throw new Error('Your session expired. Reload the page and try again.');
  const name = nickname.slice(0, 30);
  const { error } = await db.from('profiles').insert({ id: u.user.id, nickname: name });
  if (error) dbFail(error);
  return { id: u.user.id, nickname: name, placeIds: [] };
}

// Saves the districts a person chose. The address itself is never stored.
async function dbSaveLocation(userId, placeIds, bodyIds) {
  const { error } = await db.from('profiles').update({ place_ids: placeIds, body_ids: bodyIds }).eq('id', userId);
  if (error) dbFail(error);
}

// Every thread and post the shell shows, newest threads first.
async function dbLoadBoards() {
  const [t, p] = await Promise.all([
    db.from('discussion_thread_view').select('*').order('created_at', { ascending: false }),
    db.from('discussion_post_view').select('*').order('created_at'),
  ]);
  if (t.error) dbFail(t.error);
  if (p.error) dbFail(p.error);
  return { threads: t.data ?? [], posts: p.data ?? [] };
}

async function dbPostThread({ userId, scope, id, title, kind, body }) {
  const threadId = uuid4();
  const a = await db.from('discussion_threads').insert({
    id: threadId, scope_kind: scope, scope_id: id, title: title.trim(), kind, author_id: userId,
  });
  if (a.error) dbFail(a.error);
  const b = await db.from('discussion_posts').insert({ thread_id: threadId, author_id: userId, body: body.trim() });
  if (b.error) dbFail(b.error);
  return threadId;
}

async function dbPostReply({ userId, threadId, body }) {
  const { error } = await db.from('discussion_posts').insert({ thread_id: threadId, author_id: userId, body: body.trim() });
  if (error) dbFail(error);
}

async function dbSignOut() {
  await db.auth.signOut();
}
