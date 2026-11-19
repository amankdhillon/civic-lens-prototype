// Data check. Runs every query the screens use, one at a time, and shows which ones pass or fail.
// Open the site at #/check. Send the result if a page still doesn't work.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { friendly } from '../../lib/supabase.js';
import { listAllBodies, getBody, listMeetingsFor, getItem, listUpcomingMeetings } from '../../services/bodies.js';
import { getPlace, listPlaces, listOfficials, listCommunityMeetings, loadDemoPins } from '../../services/places.js';
import { listComments } from '../../services/comments.js';

async function step(label, fn, results) {
  try {
    const detail = await fn();
    results.push({ label, ok: true, detail: String(detail) });
  } catch (e) {
    const raw = e?.message ?? String(e);
    results.push({ label, ok: false, detail: friendly(raw) || raw, raw });
  }
}

function paint(root, results, finished) {
  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Data check</h1>
        <p class="lead">Each query the screens use, run once. ${finished ? 'Finished.' : 'Running…'}</p>
      </div>
    </header>
    <ul class="checks">
      ${results.map(r => `
        <li class="check ${r.ok ? 'check--ok' : 'check--fail'}">
          <strong>${r.ok ? 'Passed' : 'Failed'}: ${esc(r.label)}</strong>
          <span>${esc(r.detail)}</span>
        </li>`).join('')}
    </ul>`;
}

export async function render(root) {
  const results = [];
  paint(root, results, false);

  let bodies = [];
  await step('Load all bodies', async () => { bodies = await listAllBodies(); return `${bodies.length} bodies`; }, results);

  await step('Get one body (sd-council)', () => getBody('sd-council').then(b => b.name), results);
  await step('Meetings for one body (sd-council)', async () => (await listMeetingsFor('sd-council')).length + ' meetings', results);

  let itemId = null;
  await step('Find an agenda item', async () => {
    const meetings = await listMeetingsFor('sd-council');
    const first = meetings.flatMap(m => m.items)[0] ?? (await listMeetingsFor('bos')).flatMap(m => m.items)[0];
    if (!first) throw new Error('No agenda items found. Run the import tool.');
    itemId = first.id;
    return itemId;
  }, results);

  if (itemId) {
    await step('Get one agenda item', async () => (await getItem(itemId)).title, results);
    await step('Comments on that item', async () => (await listComments(itemId)).length + ' comments', results);
  }

  await step('Upcoming meetings for your bodies', async () =>
    (await listUpcomingMeetings(state.me?.bodyIds?.length ? state.me.bodyIds : ['sd-council', 'bos', 'sdusd'])).length + ' meetings', results);

  await step('Get one place (cd7)', () => getPlace('cd7').then(p => p.name), results);
  await step('Places for your location', async () =>
    (await listPlaces(state.me?.placeIds?.length ? state.me.placeIds : ['county-sd', 'city-sd', 'cd7', 'sdusd'])).length + ' places', results);
  await step('Officials for cd7', async () => (await listOfficials('cd7')).length + ' officials', results);
  await step('Community meetings for cd7', async () => (await listCommunityMeetings('cd7')).length + ' meetings', results);
  await step('Sample location pins', async () => (await loadDemoPins()).length + ' pins', results);

  paint(root, results, true);
}
