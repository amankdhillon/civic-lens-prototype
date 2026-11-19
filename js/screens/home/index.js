// Home: upcoming meetings and agenda items on the left, active community discussions on the right.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { listUpcomingMeetings, listMeetingsByIds, getItem } from '../../services/bodies.js';
import { listPlaces } from '../../services/places.js';
import { listRecentDiscussions, SCOPE_LABEL, scopeHref } from '../../services/discussions.js';

const PLACE_ORDER = ['county', 'congressional_district', 'state_district', 'city', 'council_district', 'school_district', 'neighborhood'];
const PLACE_KIND = {
  county: 'County',
  congressional_district: 'U.S. House',
  state_district: 'State senate',
  city: 'City',
  council_district: 'Local district',
  school_district: 'School district',
  neighborhood: 'Neighborhood',
};

const snippet = (text, n = 180) => (text.length > n ? `${text.slice(0, n).trim()}…` : text);

function meetingCard(m) {
  return `
    <article class="card meeting">
      <div class="meeting__head">
        <div>
          <p class="meta">${esc(fmtDateTime(m.startsAt))} · ${esc(m.bodyName)}</p>
          <h3><a href="#/meeting/${esc(m.id)}">${esc(m.title)}</a></h3>
        </div>
        ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: state.pins.meeting.has(m.id) })}
      </div>
      ${m.items.length
        ? `<ul class="item-list">${m.items.slice(0, 4).map(i => `
            <li><a href="#/item/${esc(i.id)}">${esc(i.title)}</a> <span class="tag">${esc(STAGE_LABEL[i.stage])}</span></li>`).join('')}</ul>`
        : ''}
    </article>`;
}

function pinnedItemCard(item) {
  return `
    <article class="card">
      <div class="meeting__head">
        <div>
          <p class="meta">${esc(item.meeting.bodyName)} · ${esc(fmtDateTime(item.meeting.startsAt))}</p>
          <h3><a href="#/item/${esc(item.id)}">${esc(item.title)}</a></h3>
          <p class="meta">${esc(STAGE_LABEL[item.stage])}</p>
        </div>
        ${pinButton({ kind: 'item', id: item.id, name: item.title, pinned: true })}
      </div>
    </article>`;
}

function discussionCard(d) {
  return `
    <article class="card discussion-card">
      <p class="meta"><span class="scope">${esc(SCOPE_LABEL[d.scope] ?? d.scope)}</span> · ${esc(d.authorName)} · ${esc(fmtDateTime(d.createdAt))}</p>
      <h3><a href="${esc(scopeHref(d.scope, d.id))}">${esc(d.title)}</a></h3>
      <p>${esc(snippet(d.body))}</p>
    </article>`;
}

export async function render(root) {
  root.innerHTML = skeleton(3);
  const [fromBodies, fromCalendar, items, places, discussions] = await Promise.all([
    listUpcomingMeetings([...state.pins.body]),
    listMeetingsByIds([...state.pins.meeting]),
    Promise.all([...state.pins.item].map(id => getItem(id))),
    listPlaces(state.me.placeIds),
    listRecentDiscussions(8),
  ]);

  const now = Date.now();
  const byId = new Map();
  [...fromBodies, ...fromCalendar]
    .filter(m => new Date(m.startsAt).getTime() >= now)
    .forEach(m => byId.set(m.id, m));
  const meetings = [...byId.values()].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const pinnedItems = items.filter(Boolean);
  const orderedPlaces = PLACE_ORDER.flatMap(kind => places.filter(p => p.kind === kind));

  root.innerHTML = `
    <header class="page-head">
      <div>
        <p class="eyebrow">Your government</p>
        <h1>Your feed</h1>
        <p class="lead">Decisions coming up where you live, and what neighbors are discussing.</p>
      </div>
    </header>

    ${orderedPlaces.length ? `
      <nav class="place-chips" aria-label="Your places">
        ${orderedPlaces.map(p => `
          <a class="place-chip" href="#/place/${esc(p.id)}">
            <span class="place-chip__kind">${esc(PLACE_KIND[p.kind] ?? p.kind)}</span>
            <span class="place-chip__name">${esc(p.name)}</span>
          </a>`).join('')}
      </nav>` : ''}

    <div class="home-grid">
      <section class="col" aria-labelledby="coming-h">
        <h2 id="coming-h">Coming up</h2>
        ${meetings.length || pinnedItems.length ? '' : `
          <div class="card stack">
            <p>Nothing scheduled yet.</p>
            <p class="meta">Follow a government body, or add a meeting to your calendar, and it appears here.</p>
            <div class="row"><a class="btn btn--primary" href="#/places">Browse your places</a></div>
          </div>`}
        ${meetings.map(meetingCard).join('')}
        ${pinnedItems.length ? `<h3 class="sub">Pinned items</h3>${pinnedItems.map(pinnedItemCard).join('')}` : ''}
      </section>

      <section class="col" aria-labelledby="talk-h">
        <h2 id="talk-h">Active discussions</h2>
        ${discussions.length
          ? discussions.map(discussionCard).join('')
          : empty('No discussions yet. Open a meeting or place and start one.')}
      </section>
    </div>`;

  bindPins(root, (kind, id, pinned) => { if (!pinned) render(root); });
}
