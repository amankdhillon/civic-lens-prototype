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
  if (/rate limit/i.test(msg) || error?.code === 'over_request_rate_limit') {
    throw new Error('Too many new visitors from this network right now. Wait a few minutes and try again.');
  }
  throw new Error(msg);
}

// Returns the signed-in user. A session saved in this browser can outlive its anonymous user (for example
// after the project is reset), so check it with the server. If the check fails, clear it and sign in again.
async function dbEnsureUser() {
  const { data: u, error } = await db.auth.getUser();
  if (!error && u?.user) return u.user;
  await db.auth.signOut({ scope: 'local' }).catch(() => {});
  const r = await db.auth.signInAnonymously();
  if (r.error) dbFail(r.error);
  const { data: again, error: againError } = await db.auth.getUser();
  if (againError || !again?.user) throw new Error('Could not start a session. Reload the page and try again.');
  return again.user;
}

// Starts a session if needed, then returns this person's profile (or null if none yet).
async function dbStart() {
  const user = await dbEnsureUser();
  const { data: row, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) dbFail(error);
  return row ? { id: row.id, nickname: row.nickname, placeIds: row.place_ids ?? [] } : null;
}

async function dbCreateProfile(nickname) {
  const user = await dbEnsureUser();
  const name = nickname.slice(0, 30);
  const { error } = await db.from('profiles').insert({ id: user.id, nickname: name });
  if (error && error.code !== '23505') dbFail(error); // 23505 = profile already exists (for example, a double click)
  if (error) {
    const existing = await dbStart();
    if (existing) return existing;
  }
  return { id: user.id, nickname: name, placeIds: [] };
}

// Saves the districts a person chose. The address itself is never stored.
async function dbSaveLocation(userId, placeIds, bodyIds) {
  const { error } = await db.from('profiles').update({ place_ids: placeIds, body_ids: bodyIds }).eq('id', userId);
  if (error) dbFail(error);
}

// Reads every row of a view in pages. The API returns at most 1,000 rows per request, so a single read
// would silently drop older threads and posts once the boards grow. Order includes id so pages never overlap.
async function dbSelectAll(view, orderCol, ascending) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(view).select('*')
      .order(orderCol, { ascending }).order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) dbFail(error);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

// Every thread and post the shell shows, newest threads first.
async function dbLoadBoards() {
  const [threads, posts] = await Promise.all([
    dbSelectAll('discussion_thread_view', 'created_at', false),
    dbSelectAll('discussion_post_view', 'created_at', true),
  ]);
  return { threads, posts };
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

// Favorites: one row per saved key (for example body:bos or item:it-1110-2), owned by the signed-in person.
async function dbLoadSaved(userId) {
  const { data, error } = await db.from('saved_items').select('key').eq('user_id', userId);
  if (error) dbFail(error);
  return (data ?? []).map(r => r.key);
}
async function dbSetSaved(userId, key, on) {
  if (on) {
    const { error } = await db.from('saved_items').upsert({ user_id: userId, key }, { onConflict: 'user_id,key', ignoreDuplicates: true });
    if (error) dbFail(error);
  } else {
    const { error } = await db.from('saved_items').delete().eq('user_id', userId).eq('key', key);
    if (error) dbFail(error);
  }
}
