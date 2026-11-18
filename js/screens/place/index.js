// One place (county, city, council district, or school area): who represents it, its community meetings,
// and the governing bodies that serve it. The same screen works for every kind of place.
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { skeleton, empty } from '../../components/ui.js';
import { getPlace, listOfficials, listCommunityMeetings } from '../../services/places.js';
import { listAllBodies } from '../../services/bodies.js';

const KIND = {
  county: 'County',
  city: 'City',
  council_district: 'City council district',
  school_district: 'School district',
  neighborhood: 'Neighborhood',
};

function officialCard(o) {
  return `
    <article class="card stack">
      <p class="meta">${esc(o.role)}</p>
      <h3>${o.name ? esc(o.name) : 'Name to be added'}</h3>
      ${o.officeUrl ? `<p><a href="${esc(o.officeUrl)}" target="_blank" rel="noopener noreferrer">Official page</a></p>` : ''}
      <p class="hint">${o.staffContact ? esc(o.staffContact) : 'Staff contact to be added.'}</p>
    </article>`;
}

function meetingCard(m) {
  return `
    <article class="card meeting">
      <p class="meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
      <h3>${esc(m.title)}</h3>
      ${m.detailsUrl ? `<p><a href="${esc(m.detailsUrl)}" target="_blank" rel="noopener noreferrer">Details and sign-up</a></p>` : ''}
    </article>`;
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(2);
  const [place, officials, meetings, bodies] = await Promise.all([
    getPlace(id), listOfficials(id), listCommunityMeetings(id), listAllBodies(),
  ]);
  const served = bodies.filter(b => b.placeId === id);

  root.innerHTML = `
    <a class="back" href="#/">Your government</a>
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(KIND[place.kind] ?? place.kind)}</p>
        <h1>${esc(place.name)}</h1>
      </div>
    </header>
    ${officials.length
      ? `<section class="stack" aria-labelledby="off-h"><h2 id="off-h">Representation</h2>${officials.map(officialCard).join('')}</section>`
      : ''}
    <section class="stack" aria-labelledby="cm-h">
      <h2 id="cm-h">Community meetings</h2>
      ${meetings.length ? meetings.map(meetingCard).join('') : empty('No community meetings listed yet.')}
    </section>
    ${served.length
      ? `<section class="stack" aria-labelledby="bodies-h">
           <h2 id="bodies-h">Governing bodies</h2>
           <ul class="body-list">
             ${served.map(b => `<li><a class="body-row" href="#/body/${esc(b.id)}"><span class="body-row__name">${esc(b.name)}</span></a></li>`).join('')}
           </ul>
         </section>`
      : ''}
    ${place.sourceUrl ? `<p class="links"><a href="${esc(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source for this place</a></p>` : ''}
    <p class="note">Discussion happens on agenda items, which you reach from each governing body.</p>`;
}
