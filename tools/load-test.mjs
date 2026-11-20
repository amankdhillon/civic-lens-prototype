// Load test for the prototype shell: simulates N people signing in, reading the boards, and replying.
// Run from the tools folder after `npm install`:
//   SUPABASE_URL=https://your-project.supabase.co SUPABASE_KEY=sb_publishable_... USERS=40 node load-test.mjs
// Uses the PUBLISHABLE key only, the same key the website uses. It creates real anonymous users and posts
// replies whose body starts with "loadtest", so the data can be found and removed afterwards.
// Reports errors and timings. Failed sign-ins usually mean the per-network anonymous sign-in limit was hit.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const USERS = Number(process.env.USERS || 40);
const ROUNDS = Number(process.env.ROUNDS || 3);
const THREAD_ID = process.env.THREAD_ID || 'a1000000-0000-4000-8000-000000000001'; // a seeded topic thread
if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY first.');
  process.exit(1);
}

const stats = { signin: [], profile: [], read: [], reply: [] };
const errors = {};
const note = (step, err) => {
  const key = `${step}: ${err?.message ?? err}`;
  errors[key] = (errors[key] || 0) + 1;
};

function newClient() {
  return createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

async function timed(step, fn) {
  const t0 = performance.now();
  try {
    const out = await fn();
    stats[step].push(performance.now() - t0);
    return out;
  } catch (e) {
    note(step, e);
    return null;
  }
}

async function readAll(db, view, col, asc) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(view).select('id').order(col, { ascending: asc }).order('id').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

async function oneUser(i) {
  const db = newClient();
  const signed = await timed('signin', async () => {
    const { data, error } = await db.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  });
  if (!signed) return;
  await timed('profile', async () => {
    const { error } = await db.from('profiles').insert({ id: signed.id, nickname: `loadtest ${i}` });
    if (error) throw error;
  });
  for (let r = 0; r < ROUNDS; r++) {
    await timed('read', async () => {
      await Promise.all([
        readAll(db, 'discussion_thread_view', 'created_at', false),
        readAll(db, 'discussion_post_view', 'created_at', true),
      ]);
    });
    await timed('reply', async () => {
      const { error } = await db.from('discussion_posts').insert({
        thread_id: THREAD_ID, author_id: signed.id, body: `loadtest reply ${i}-${r}`,
      });
      if (error) throw error;
    });
  }
}

const t0 = performance.now();
await Promise.all(Array.from({ length: USERS }, (_, i) => oneUser(i + 1)));
const total = ((performance.now() - t0) / 1000).toFixed(1);

const pct = (arr, p) => {
  if (!arr.length) return '-';
  const s = [...arr].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]) + ' ms';
};
console.log(`\nUsers: ${USERS}, reads per user: ${ROUNDS}, total time: ${total} s\n`);
console.log('step      ok    p50       p95');
for (const step of Object.keys(stats)) {
  const ok = stats[step].length;
  console.log(`${step.padEnd(9)} ${String(ok).padEnd(5)} ${pct(stats[step], 50).padEnd(9)} ${pct(stats[step], 95)}`);
}
const errKeys = Object.keys(errors);
console.log(errKeys.length ? '\nErrors:' : '\nNo errors.');
for (const k of errKeys) console.log(`  ${errors[k]} x ${k}`);
console.log('\nCleanup: loadtest replies can be removed with: delete from discussion_posts where body like \'loadtest%\';');
