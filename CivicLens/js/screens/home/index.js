// Home: your places (county, city, council district, school area) and your bodies, each with its next meeting.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { LEVELS, LEVEL_ORDER } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { listAllBodies, listUpcomingMeetings } from '../../services/bodies.js';
import { listPlaces } from '../../services/places.js';

const PLACE_ORDER = ['county', 'city', 'council_district', 'school_district', 'neighborhood'];
const KIND = {
  county: 'County',
  city: 'City',
  council_district: 'Council district',
  school_district: 'School district',
  neighborhood: 'Neighborhood',
};

export async function render(root) {
  root.innerHTML = skeleton(3);
  const [places, all, meetings] = await Promise.all([
    listPlaces(state.me.placeIds),
    listAllBodies(),
    listUpcomingMeetings(state.me.bodyIds),
  ]);
  const live = meetings.find(m => m.status === 'in_progress');

  const placeRows = PLACE_ORDER.flatMap(kind => places.filter(p => p.kind === kind))
    .map(p => `
      <li>
        <a class="body-row" href="#/place/${esc(p.id)}">
          <span class="body-row__level">${esc(KIND[p.kind])}</span>
          <span class="body-row__name">${esc(p.name)}</span>
        </a>
      </li>`).join('');

  const bodies = LEVEL_ORDER.flatMap(level =>
    all.filter(b => b.level === level && state.me.bodyIds.includes(b.id)));
  const bodyRows = bodies.map(b => {
    const next = meetings.find(m => m.bodyId === b.id);
    return `
      <li>
        <a class="body-row" href="#/body/${esc(b.id)}">
          <span class="body-row__level">${esc(LEVELS[b.level])}</span>
          <span class="body-row__name">${esc(b.name)}</span>
          <span class="body-row__next">${next ? `Next: ${esc(fmtDateTime(next.startsAt))}` : 'No meeting loaded yet'}</span>
        </a>
      </li>`;
  }).join('');

  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Your government</h1>
        <p class="lead">Who represents you, and which bodies make decisions where you live.</p>
      </div>
      <a class="link" href="#/location">Change location</a>
    </header>
    ${live ? `<p class="live-line"><strong>In progress:</strong> <a href="#/body/${esc(live.bodyId)}">${esc(live.bodyName)}</a> is meeting now.</p>` : ''}
    <section class="stack" aria-labelledby="places-h">
      <h2 id="places-h">Your places</h2>
      ${places.length ? `<ul class="body-list">${placeRows}</ul>` : empty('No places chosen yet.')}
    </section>
    <section class="stack" aria-labelledby="bodies-h">
      <h2 id="bodies-h">Your bodies</h2>
      ${bodies.length ? `<ul class="body-list">${bodyRows}</ul>` : empty('No governing bodies chosen yet.')}
    </section>`;
}
