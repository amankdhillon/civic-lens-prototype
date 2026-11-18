// Home: your bodies, each with its next meeting. One action: open a body.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { LEVELS, LEVEL_ORDER } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { listAllBodies, listUpcomingMeetings } from '../../services/bodies.js';

export async function render(root) {
  root.innerHTML = skeleton(3);
  const [all, meetings] = await Promise.all([listAllBodies(), listUpcomingMeetings(state.me.bodyIds)]);
  const bodies = LEVEL_ORDER.flatMap(level =>
    all.filter(b => b.level === level && state.me.bodyIds.includes(b.id)));
  const live = meetings.find(m => m.status === 'in_progress');

  const rows = bodies.map(b => {
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
        <p class="lead">The bodies that make decisions where you live, and when they meet next.</p>
      </div>
      <a class="link" href="#/address">Change bodies</a>
    </header>
    ${live ? `<p class="live-line"><strong>In progress:</strong> <a href="#/body/${esc(live.bodyId)}">${esc(live.bodyName)}</a> is meeting now.</p>` : ''}
    ${bodies.length
      ? `<ul class="body-list">${rows}</ul>`
      : empty('You haven\'t chosen any bodies yet.')}`;
}
