// Feed: what you pinned. Meetings of bodies you follow and meetings on your calendar, soonest first, then pinned items.
// Empty until you follow a body or add a meeting. Places are listed for quick access.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { listUpcomingMeetings, listMeetingsByIds, getItem } from '../../services/bodies.js';
import { listPlaces } from '../../services/places.js';

function feedMeeting(m) {
  return `
    <article class="card meeting">
      <div class="meeting__head">
        <div>
          <p class="meta">${esc(fmtDateTime(m.startsAt))} · ${esc(m.bodyName)}</p>
          <h3>${esc(m.title)}</h3>
        </div>
        ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: state.pins.meeting.has(m.id) })}
      </div>
      ${m.items.length
        ? `<ul class="item-list">${m.items.map(i => `
            <li><a href="#/item/${esc(i.id)}">${esc(i.title)}</a> <span class="tag">${esc(STAGE_LABEL[i.stage])}</span></li>`).join('')}</ul>`
        : ''}
    </article>`;
}

function feedItem(item) {
  return `
    <article class="card">
      <div class="meeting__head">
        <div>
          <p class="meta">${esc(item.meeting.bodyName)} · ${esc(fmtDateTime(item.meeting.startsAt))}</p>
          <h3><a href="#/item/${esc(item.id)}">${esc(item.title)}</a></h3>
          <p class="row__meta">${esc(STAGE_LABEL[item.stage])}</p>
        </div>
        ${pinButton({ kind: 'item', id: item.id, name: item.title, pinned: true })}
      </div>
    </article>`;
}

export async function render(root) {
  root.innerHTML = skeleton(3);
  const followed = [...state.pins.body];
  const pinnedMeetingIds = [...state.pins.meeting];
  const pinnedItemIds = [...state.pins.item];

  const [fromBodies, fromCalendar, items, places] = await Promise.all([
    listUpcomingMeetings(followed),
    listMeetingsByIds(pinnedMeetingIds),
    Promise.all(pinnedItemIds.map(id => getItem(id))),
    listPlaces(state.me.placeIds),
  ]);

  const now = Date.now();
  const byId = new Map();
  [...fromBodies, ...fromCalendar]
    .filter(m => new Date(m.startsAt).getTime() >= now)
    .forEach(m => byId.set(m.id, m));
  const meetings = [...byId.values()].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const pinnedItems = items.filter(Boolean);
  const nothingPinned = !meetings.length && !pinnedItems.length;

  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Your feed</h1>
        <p class="lead">Meetings and agenda items you've pinned, and the next meetings of bodies you follow.</p>
      </div>
    </header>

    ${nothingPinned ? `
      <section class="card stack">
        <p>Nothing pinned yet.</p>
        <p class="row__meta">Open a place and follow the bodies that matter to you. Their meetings show up here.</p>
        <div class="row"><a class="btn btn--primary" href="#/places">Find your places</a></div>
      </section>` : ''}

    ${meetings.length ? `
      <section class="stack" aria-labelledby="meetings-h">
        <h2 id="meetings-h">Upcoming meetings</h2>
        ${meetings.map(feedMeeting).join('')}
      </section>` : ''}

    ${pinnedItems.length ? `
      <section class="stack" aria-labelledby="items-h">
        <h2 id="items-h">Pinned items</h2>
        ${pinnedItems.map(feedItem).join('')}
      </section>` : ''}

    ${places.length ? `
      <section class="stack" aria-labelledby="places-h">
        <h2 id="places-h">Your places</h2>
        <ul class="rows">
          ${places.map(p => `<li class="row"><a class="row__name" href="#/place/${esc(p.id)}">${esc(p.name)}</a></li>`).join('')}
        </ul>
      </section>` : empty('No places chosen yet.')}`;

  bindPins(root, (kind, id, pinned) => { if (!pinned) render(root); });
}
