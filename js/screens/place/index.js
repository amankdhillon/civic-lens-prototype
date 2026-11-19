// One place. Governing bodies sit under their level, subcommittees under their parent. Community groups, representation,
// upcoming community meetings, and the place discussion follow.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { LEVELS, LEVEL_ORDER } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins, setPinButton } from '../../components/pin-button.js';
import { announce, toast } from '../../components/toast.js';
import { getPlace, listPlaces, listOfficials, listCommunityMeetings } from '../../services/places.js';
import { listBodiesForPlace } from '../../services/bodies.js';
import { saveLocation, loadMe } from '../../services/auth.js';
import { listDiscussion } from '../../services/discussions.js';
import { renderDiscussion, bindDiscussion, discussionHtml } from '../../components/discussion.js';

const KIND = {
  county: 'County',
  city: 'City',
  council_district: 'Local district',
  school_district: 'School district',
  congressional_district: 'U.S. House district',
  state_district: 'State senate district',
  neighborhood: 'Neighborhood',
};

function bodyRow(b, nested = false) {
  return `
    <li class="row ${nested ? 'row--nested' : ''}">
      <a class="row__text" href="#/body/${esc(b.id)}">
        <span class="row__name">${esc(b.name)}</span>
        <span class="row__meta">${esc(b.scheduleText || 'Schedule not listed yet')}</span>
      </a>
      ${pinButton({ kind: 'body', id: b.id, name: b.name, pinned: state.pins.body.has(b.id) })}
    </li>`;
}

function governingHtml(bodies) {
  const governing = bodies.filter(b => b.kind === 'governing');
  const committees = bodies.filter(b => b.kind === 'committee');
  const sections = LEVEL_ORDER.map(level => {
    const group = governing.filter(b => b.level === level);
    if (!group.length) return '';
    return `
      <div class="level-block">
        <h3 class="level">${esc(LEVELS[level])}</h3>
        <ul class="rows">
          ${group.map(b => `
            ${bodyRow(b)}
            ${committees.filter(c => c.parentId === b.id).map(c => bodyRow(c, true)).join('')}`).join('')}
        </ul>
      </div>`;
  }).join('');
  return sections || empty('No governing bodies are listed for this place yet.');
}

function listBlock(title, items, emptyText) {
  return `
    <section class="stack" aria-label="${esc(title)}">
      <h2>${esc(title)}</h2>
      ${items.length ? `<ul class="rows">${items.map(b => bodyRow(b)).join('')}</ul>` : empty(emptyText)}
    </section>`;
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
    listDiscussion('place', id),
  ]);
  const canPost = state.me.placeIds.includes(id);
  const localPlaces = place.kind === 'council_district'
    ? [place]
    : myPlaces.filter(p => p.kind === 'council_district' && p.parentId === id);

  root.innerHTML = `
    <header class="place-head">
      <p class="crumbs">${parent ? `<a href="#/place/${esc(parent.id)}">${esc(parent.name)}</a> / ` : ''}${esc(KIND[place.kind] ?? place.kind)}</p>
      <h1>${esc(place.name)}</h1>
      <p class="lead">${canPost ? 'You live here. You can join the discussion.' : 'Read-only. Residents of this place can join the discussion.'}</p>
    </header>

    ${localPlaces.length ? `
      <section class="stack" aria-label="Your local district">
        <h2>Your local district</h2>
        <ul class="rows">
          ${localPlaces.map(p => `
            <li class="row">
              <div class="row__text">
                <span class="row__name">${esc(p.name)} threads</span>
                <span class="row__meta">Local discussions for this district</span>
              </div>
              ${pinButton({ kind: 'district', id: p.id, name: p.name, pinned: state.me.placeIds.includes(p.id), action: 'join-district' })}
            </li>`).join('')}
        </ul>
      </section>` : ''}

    <section class="stack" aria-labelledby="gov-h">
      <h2 id="gov-h">Governing bodies</h2>
      ${governingHtml(bodies)}
    </section>

    ${listBlock('Community groups', bodies.filter(b => b.kind === 'community'), 'No community groups listed here yet.')}
    ${listBlock('Citywide boards and commissions', bodies.filter(b => b.kind === 'board'), 'No boards or commissions listed here yet.')}

    ${officials.length ? `
      <section class="stack" aria-labelledby="rep-h">
        <h2 id="rep-h">Representation</h2>
        <div class="card-grid">
          ${officials.map(o => `
            <article class="card">
              <p class="meta">${esc(o.role)}</p>
              <p class="row__name">${o.name ? esc(o.name) : 'Name to be added'}</p>
              ${o.officeUrl ? `<p><a href="${esc(o.officeUrl)}" target="_blank" rel="noopener noreferrer">Official page</a></p>` : ''}
            </article>`).join('')}
        </div>
      </section>` : ''}

    <section class="stack" aria-labelledby="cm-h">
      <h2 id="cm-h">Community meetings</h2>
      ${meetings.length ? `
        <ul class="rows">
          ${meetings.slice(0, 5).map(m => `
            <li class="row">
              <div class="row__text">
                <a class="row__name" href="#/meeting/${esc(m.id)}">${esc(m.title)}</a>
                <span class="row__meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}</span>
              </div>
              ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: state.pins.meeting.has(m.id) })}
            </li>`).join('')}
        </ul>` : empty('No community meetings listed yet.')}
    </section>

    <section class="stack discussion" aria-labelledby="disc-h">
      <h2 id="disc-h">Discussion for ${esc(place.name)}</h2>
      <div id="discussion">${discussionHtml(comments, { scope: 'place', id, canPost })}</div>
    </section>

    ${place.sourceUrl ? `<p class="links"><a href="${esc(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source for this place</a></p>` : ''}`;

  bindPins(root, () => {});
  bindDiscussion(root);
  root.addEventListener('discussion:posted', () => renderDiscussion(root.querySelector('#discussion'), { scope: 'place', id, canPost }));

  // Joining a local district is membership in its threads. It saves to the profile like the location step does.
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
}
