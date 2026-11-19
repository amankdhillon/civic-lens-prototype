// One body: what it is, its upcoming meetings, and recent ones. One action: open an item.
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { LEVELS, STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { getBody, listMeetingsFor } from '../../services/bodies.js';

function meetingBlock(list) {
  if (!list.length) return empty('No meetings loaded yet.');
  return list.map(m => `
    <article class="card meeting">
      <p class="meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}${m.status === 'in_progress' ? ' · in progress' : ''}</p>
      <h3>${esc(m.title)}</h3>
      ${m.items.length
        ? `<ul class="item-list">${m.items.map(i => `
            <li><a href="#/item/${esc(i.id)}">${esc(i.title)}</a> <span class="tag">${esc(STAGE_LABEL[i.stage])}</span></li>`).join('')}</ul>`
        : '<p class="empty">No agenda items posted yet.</p>'}
    </article>`).join('');
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(2);
  const [body, meetings] = await Promise.all([getBody(id), listMeetingsFor(id)]);
  const now = Date.now();
  const upcoming = meetings
    .filter(m => new Date(m.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const recent = meetings.filter(m => new Date(m.startsAt).getTime() < now).slice(0, 5);
  const links = [
    body.sourceUrl && `<a href="${esc(body.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official website</a>`,
    body.agendaUrl && `<a href="${esc(body.agendaUrl)}" target="_blank" rel="noopener noreferrer">Official agendas</a>`,
    body.watchUrl && `<a href="${esc(body.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch meetings</a>`,
  ].filter(Boolean).join(' · ');

  root.innerHTML = `
    <a class="back" href="#/">Your government</a>
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(LEVELS[body.level])}${body.districtLabel ? ` · ${esc(body.districtLabel)}` : ''}</p>
        <h1>${esc(body.name)}</h1>
        <p class="lead">${esc(body.about)}</p>
      </div>
    </header>
    ${links ? `<p class="links">${links}</p>` : ''}
    <section class="stack" aria-labelledby="up-h">
      <h2 id="up-h">Upcoming</h2>
      ${meetingBlock(upcoming)}
    </section>
    ${recent.length ? `
      <section class="stack" aria-labelledby="past-h">
        <h2 id="past-h">Recent</h2>
        ${meetingBlock(recent)}
      </section>` : ''}`;
}
