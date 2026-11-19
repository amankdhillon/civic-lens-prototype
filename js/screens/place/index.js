// One place: a city, a council district, the county, or a school area.
// Governing bodies are grouped by level of government. Joining a body or a local district is one tap.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { skeleton, empty } from '../../components/ui.js';
import { joinButton } from '../../components/join-button.js';
import { announce } from '../../components/toast.js';
import { getPlace, listPlaces, listOfficials, listCommunityMeetings } from '../../services/places.js';
import { listAllBodies } from '../../services/bodies.js';
import { saveLocation, loadMe } from '../../services/auth.js';

// Shown in this order. Empty groups are skipped.
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

// Builds the rows for each group, with the current joined state.
function buildGroups(place, bodies, localPlaces) {
  const joinedBody = id => state.me.bodyIds.includes(id);
  const joinedPlace = id => state.me.placeIds.includes(id);
  const governing = bodies.filter(b => b.placeId === place.id && b.kind !== 'board');
  const boards = bodies.filter(b => b.placeId === place.id && b.kind === 'board');

  const bodyRow = b => ({ kind: 'body', id: b.id, name: b.name, meta: b.scheduleText || 'Schedule not listed yet', joined: joinedBody(b.id) });
  const localRow = p => ({ kind: 'place', id: p.id, name: `${p.name} threads`, meta: 'Local discussions', joined: joinedPlace(p.id) });

  return {
    local: localPlaces.map(localRow),
    city: governing.filter(b => b.level === 'city').map(bodyRow),
    boards: boards.map(bodyRow),
    school: governing.filter(b => b.level === 'school').map(bodyRow),
    county: governing.filter(b => b.level === 'county').map(bodyRow),
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
            ${joinButton({ kind: r.kind, id: r.id, name: r.name, joined: r.joined })}
          </li>`).join('')}
      </ul>
    </section>`).join('');
  return sections || empty('Nothing to join here yet.');
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(3);
  const place = await getPlace(id);
  const [parent, bodies, officials, meetings, myPlaces] = await Promise.all([
    place.parentId ? getPlace(place.parentId) : null,
    listAllBodies(),
    listOfficials(id),
    listCommunityMeetings(id),
    listPlaces(state.me.placeIds),
  ]);

  // Local threads: this district itself, or the districts you're in when viewing their city.
  const localPlaces = place.kind === 'council_district'
    ? [place]
    : myPlaces.filter(p => p.kind === 'council_district' && p.parentId === id);

  root.innerHTML = `
    <header class="place-head">
      <p class="crumbs">${parent ? `<a href="#/place/${esc(parent.id)}">${esc(parent.name)}</a> / ` : ''}${esc(KIND[place.kind] ?? place.kind)}</p>
      <h1>${esc(place.name)}</h1>
    </header>

    <div id="groups" class="groups">${groupsHtml(buildGroups(place, bodies, localPlaces))}</div>

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
          ${meetings.slice(0, 3).map(m => `
            <li class="row">
              <div class="row__text">
                <p class="row__name">${esc(m.title)}</p>
                <p class="row__meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
              </div>
              ${m.detailsUrl ? `<a class="link-btn" href="${esc(m.detailsUrl)}" target="_blank" rel="noopener noreferrer">Details</a>` : ''}
            </li>`).join('')}
        </ul>` : empty('No community meetings listed yet.')}
    </section>

    ${place.sourceUrl ? `<p class="links"><a href="${esc(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source for this place</a></p>` : ''}`;

  // One listener for the whole page. Joining saves to the profile, so it survives a refresh.
  root.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="toggle"]');
    if (!btn) return;
    const { kind, id: target } = btn.dataset;
    const placeIds = [...state.me.placeIds];
    const bodyIds = [...state.me.bodyIds];
    const list = kind === 'place' ? placeIds : bodyIds;
    const at = list.indexOf(target);
    const nowJoined = at < 0;
    if (nowJoined) list.push(target); else list.splice(at, 1);

    btn.disabled = true;
    try {
      await saveLocation(state.me.id, { placeIds, bodyIds });
      state.me = await loadMe();
      const rows = buildGroups(place, bodies, localPlaces);
      root.querySelector('#groups').innerHTML = groupsHtml(rows);
      const name = btn.getAttribute('aria-label').replace(/^(Join|Leave) /, '');
      announce(`${nowJoined ? 'Joined' : 'Left'} ${name}`);
    } catch {
      btn.disabled = false;
      announce('That didn’t save. Try again.');
    }
  });
}
