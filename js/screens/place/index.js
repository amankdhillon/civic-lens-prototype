// One place: general discussion, the bodies you can follow grouped by level, your district, representation, and community meetings.
// Only residents can post in the general discussion or join a district.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { COMMENT_KINDS } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins, setPinButton } from '../../components/pin-button.js';
import { toast, announce } from '../../components/toast.js';
import { getPlace, listPlaces, listOfficials, listCommunityMeetings } from '../../services/places.js';
import { listBodiesForPlace } from '../../services/bodies.js';
import { saveLocation, loadMe } from '../../services/auth.js';
import { listPlaceComments, addPlaceComment } from '../../services/placeComments.js';

const GROUPS = ['local', 'city', 'boards', 'school', 'county'];
const TITLE = {
  local: 'Your district',
  city: 'City',
  boards: 'Citywide boards and commissions',
  school: 'School district',
  county: 'County',
};
const KIND = {
  county: 'County',
  city: 'City',
  council_district: 'City council district',
  school_district: 'School district',
  neighborhood: 'Neighborhood',
};
const KIND_LABEL = Object.fromEntries(COMMENT_KINDS.map(k => [k.value, k.label]));

// Rows for each group. Bodies follow with a plus. Your district is joined with a plus, and it's membership, not a pin.
function buildRows(place, bodies, localPlaces) {
  const governing = bodies.filter(b => b.placeId === place.id && b.kind !== 'board');
  const boards = bodies.filter(b => b.placeId === place.id && b.kind === 'board');
  const body = b => ({ kind: 'body', id: b.id, name: b.name, meta: b.scheduleText || 'Schedule not listed yet', pinned: state.pins.body.has(b.id) });
  return {
    local: localPlaces.map(p => ({ kind: 'district', id: p.id, name: `${p.name} threads`, meta: 'Local discussions', pinned: state.me.placeIds.includes(p.id) })),
    city: governing.filter(b => b.level === 'city').map(body),
    boards: boards.map(body),
    school: governing.filter(b => b.level === 'school').map(body),
    county: governing.filter(b => b.level === 'county').map(body),
  };
}

function groupsHtml(rows) {
  const sections = GROUPS.filter(g => rows[g]?.length).map(g => `
    <section class="group" aria-labelledby="g-${g}">
      <h2 id="g-${g}">${esc(TITLE[g])}</h2>
      <ul class="rows">
        ${rows[g].map(r => `
          <li class="row">
            <div class="row__text">
              <p class="row__name">${esc(r.name)}</p>
              <p class="row__meta">${esc(r.meta)}</p>
            </div>
            ${pinButton({ kind: r.kind, id: r.id, name: r.name, pinned: r.pinned, action: r.kind === 'district' ? 'join-district' : 'pin' })}
          </li>`).join('')}
      </ul>
    </section>`).join('');
  return sections || empty('Nothing to follow here yet.');
}

function discussionHtml(comments, canPost) {
  const list = comments.length
    ? `<ol class="comments">${comments.map(c => `
        <li class="comment">
          <p class="meta"><strong>${esc(c.authorName)}</strong> <span class="tag">${esc(KIND_LABEL[c.kind])}</span> ${esc(fmtDateTime(c.createdAt))}</p>
          <p class="comment__body">${esc(c.body)}</p>
          ${c.sourceUrl ? `<p><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></p>` : ''}
        </li>`).join('')}</ol>`
    : '<p class="empty">No general discussion yet. Start it with a question.</p>';
  const form = canPost ? `
    <form id="place-composer" class="composer">
      <div class="field">
        <label for="pc-kind">Type</label>
        <select id="pc-kind" name="kind" class="input">
          ${COMMENT_KINDS.map(k => `<option value="${esc(k.value)}">${esc(k.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="pc-text">Your message</label>
        <textarea id="pc-text" name="body" class="input" rows="3" required></textarea>
      </div>
      <div class="field">
        <label for="pc-source">Source link <span class="muted">(required for information)</span></label>
        <input id="pc-source" name="source" class="input" type="url" placeholder="https://">
      </div>
      <div class="row"><button class="btn btn--primary" type="submit">Post</button></div>
      <p class="form-error" role="alert"></p>
    </form>`
    : '<p class="row__meta">Residents of this place can post here. Everyone can read.</p>';
  return list + form;
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(3);
  const place = await getPlace(id);
  const [parent, bodies, officials, meetings, myPlaces, comments] = await Promise.all([
    place.parentId ? getPlace(place.parentId) : null,
    listBodiesForPlace(id),
    listOfficials(id),
    listCommunityMeetings(id),
    listPlaces(state.me.placeIds),
    listPlaceComments(id),
  ]);
  const canPost = state.me.placeIds.includes(id);
  const localPlaces = place.kind === 'council_district'
    ? [place]
    : myPlaces.filter(p => p.kind === 'council_district' && p.parentId === id);

  root.innerHTML = `
    <header class="place-head">
      <p class="crumbs">${parent ? `<a href="#/place/${esc(parent.id)}">${esc(parent.name)}</a> / ` : ''}${esc(KIND[place.kind] ?? place.kind)}</p>
      <h1>${esc(place.name)}</h1>
    </header>

    <section class="stack" aria-labelledby="general-h">
      <h2 id="general-h">General discussion</h2>
      <div id="place-comments">${discussionHtml(comments, canPost)}</div>
    </section>

    <div id="groups" class="groups">${groupsHtml(buildRows(place, bodies, localPlaces))}</div>

    ${officials.length ? `
      <section class="group" aria-labelledby="rep-h">
        <h2 id="rep-h">Representation</h2>
        ${officials.map(o => `
          <article class="card">
            <p class="row__meta">${esc(o.role)}</p>
            <p class="row__name">${o.name ? esc(o.name) : 'Name to be added'}</p>
            ${o.officeUrl ? `<p><a href="${esc(o.officeUrl)}" target="_blank" rel="noopener noreferrer">Official page</a></p>` : ''}
          </article>`).join('')}
      </section>` : ''}

    <section class="group" aria-labelledby="cm-h">
      <h2 id="cm-h">Upcoming community meetings</h2>
      ${meetings.length ? `
        <ul class="rows">
          ${meetings.slice(0, 5).map(m => `
            <li class="row">
              <div class="row__text">
                <p class="row__name">${esc(m.title)}</p>
                <p class="row__meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
                ${m.detailsUrl ? `<p><a href="${esc(m.detailsUrl)}" target="_blank" rel="noopener noreferrer">Details and sign-up</a></p>` : ''}
              </div>
              ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: state.pins.meeting.has(m.id) })}
            </li>`).join('')}
        </ul>` : empty('No community meetings listed yet.')}
    </section>

    ${place.sourceUrl ? `<p class="links"><a href="${esc(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source for this place</a></p>` : ''}`;

  bindPins(root, () => {});

  // Joining your district: membership in the place's threads.
  root.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="join-district"]');
    if (!btn) return;
    const placeIds = [...state.me.placeIds];
    const at = placeIds.indexOf(btn.dataset.id);
    const nowJoined = at < 0;
    if (nowJoined) placeIds.push(btn.dataset.id); else placeIds.splice(at, 1);
    btn.disabled = true;
    try {
      await saveLocation(state.me.id, { placeIds, bodyIds: state.me.bodyIds });
      state.me = await loadMe();
      setPinButton(btn, nowJoined);
      announce(`${nowJoined ? 'Joined' : 'Left'} ${btn.dataset.name}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // General discussion: residents only. The database checks residency too.
  root.addEventListener('submit', async e => {
    if (e.target.id !== 'place-composer') return;
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const kind = data.get('kind');
    const body = String(data.get('body') || '').trim();
    const source = String(data.get('source') || '').trim();
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';
    if (!body) { errorEl.textContent = 'Write your message first.'; return; }
    if (kind === 'information' && !/^https:\/\/\S+$/.test(source)) {
      errorEl.textContent = 'Information needs a source link that starts with https://';
      return;
    }
    try {
      await addPlaceComment({ userId: state.me.id, placeId: id, kind, body, sourceUrl: source });
      root.querySelector('#place-comments').innerHTML = discussionHtml(await listPlaceComments(id), canPost);
      toast('Posted');
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
