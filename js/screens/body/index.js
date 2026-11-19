// A government body or community group: what it does, its subcommittees, its meetings, and its discussion.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { LEVELS, STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { getBody, listMeetingsFor, listSubBodies } from '../../services/bodies.js';
import { listDiscussion } from '../../services/discussions.js';
import { renderDiscussion, bindDiscussion, discussionHtml } from '../../components/discussion.js';

const KIND_LABEL = { governing: 'Governing body', committee: 'Subcommittee', board: 'Citywide board', community: 'Community group' };

function meetingCard(m) {
  return `
    <article class="card meeting">
      <div class="meeting__head">
        <div>
          <p class="meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}${m.status === 'in_progress' ? ' · in progress' : ''}</p>
          <h3><a href="#/meeting/${esc(m.id)}">${esc(m.title)}</a></h3>
        </div>
        ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: state.pins.meeting.has(m.id) })}
      </div>
      ${m.items.length
        ? `<ul class="item-list">${m.items.map(i => `<li><a href="#/item/${esc(i.id)}">${esc(i.title)}</a> <span class="tag">${esc(STAGE_LABEL[i.stage])}</span></li>`).join('')}</ul>`
        : '<p class="meta">No agenda items posted yet.</p>'}
    </article>`;
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(3);
  const [body, meetings, subs, comments] = await Promise.all([
    getBody(id),
    listMeetingsFor(id),
    listSubBodies(id),
    listDiscussion('body', id),
  ]);
  const parent = body.parentId ? await getBody(body.parentId) : null;
  const canPost = state.me.placeIds.includes(body.placeId);
  const now = Date.now();
  const upcoming = meetings.filter(m => new Date(m.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const recent = meetings.filter(m => new Date(m.startsAt).getTime() < now).slice(0, 5);
  const links = [
    body.sourceUrl && `<a href="${esc(body.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official website</a>`,
    body.agendaUrl && `<a href="${esc(body.agendaUrl)}" target="_blank" rel="noopener noreferrer">Official agendas</a>`,
    body.watchUrl && `<a href="${esc(body.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch meetings</a>`,
  ].filter(Boolean);

  root.innerHTML = `
    <a class="back" href="${parent ? `#/body/${esc(parent.id)}` : '#/'}">${parent ? esc(parent.name) : 'Home'}</a>
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(KIND_LABEL[body.kind] ?? 'Body')} · ${esc(LEVELS[body.level] ?? body.level)}${body.districtLabel ? ` · ${esc(body.districtLabel)}` : ''}</p>
        <h1>${esc(body.name)}</h1>
      </div>
      ${pinButton({ kind: 'body', id: body.id, name: body.name, pinned: state.pins.body.has(body.id) })}
    </header>

    <section class="card summary" aria-labelledby="sum-h">
      <h2 id="sum-h">Summary</h2>
      <p>${esc(body.about)}</p>
      <dl class="facts">
        <dt>Meets</dt><dd>${esc(body.scheduleText || 'Not listed yet')}</dd>
        ${body.kind === 'community' ? '<dt>What it is</dt><dd>A community group. It is not a government body and doesn\'t vote on decisions.</dd>' : ''}
      </dl>
      ${links.length ? `<p class="links">${links.join(' · ')}</p>` : ''}
    </section>

    ${subs.length ? `
      <section class="stack" aria-labelledby="sub-h">
        <h2 id="sub-h">Subcommittees</h2>
        <ul class="rows">
          ${subs.map(s => `
            <li class="row">
              <a class="row__text" href="#/body/${esc(s.id)}">
                <span class="row__name">${esc(s.name)}</span>
                <span class="row__meta">${esc(s.scheduleText || 'Schedule not listed yet')}</span>
              </a>
              ${pinButton({ kind: 'body', id: s.id, name: s.name, pinned: state.pins.body.has(s.id) })}
            </li>`).join('')}
        </ul>
      </section>` : ''}

    <section class="stack" aria-labelledby="up-h">
      <h2 id="up-h">Upcoming meetings</h2>
      ${upcoming.length ? upcoming.map(meetingCard).join('') : empty('No upcoming meetings loaded.')}
    </section>

    ${recent.length ? `
      <section class="stack" aria-labelledby="past-h">
        <h2 id="past-h">Recent meetings</h2>
        ${recent.map(meetingCard).join('')}
      </section>` : ''}

    <section class="stack discussion" aria-labelledby="disc-h">
      <h2 id="disc-h">Discussion about ${esc(body.name)}</h2>
      <div id="discussion">${discussionHtml(comments, { scope: 'body', id, canPost })}</div>
    </section>`;

  bindPins(root, () => {});
  bindDiscussion(root);
  root.addEventListener('discussion:posted', () => renderDiscussion(root.querySelector('#discussion'), { scope: 'body', id, canPost }));
}
