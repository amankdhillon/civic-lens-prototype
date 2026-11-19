// Your places, grouped by kind. Each one opens its place page.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { skeleton, empty } from '../../components/ui.js';
import { listPlaces } from '../../services/places.js';

const ORDER = ['county', 'city', 'council_district', 'school_district', 'neighborhood'];
const KIND = {
  county: 'County',
  city: 'City',
  council_district: 'City council district',
  school_district: 'School district',
  neighborhood: 'Neighborhood',
};

export async function render(root) {
  root.innerHTML = skeleton(2);
  const places = await listPlaces(state.me.placeIds);
  const rows = ORDER.flatMap(kind => places.filter(p => p.kind === kind)).map(p => `
    <li class="row">
      <a class="row__text" href="#/place/${esc(p.id)}">
        <span class="row__meta">${esc(KIND[p.kind])}</span>
        <span class="row__name">${esc(p.name)}</span>
      </a>
    </li>`).join('');

  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Places</h1>
        <p class="lead">Where you live, from the county down to your council district.</p>
      </div>
    </header>
    ${places.length ? `<ul class="rows">${rows}</ul>` : empty('No places chosen yet. Set your location first.')}`;
}
