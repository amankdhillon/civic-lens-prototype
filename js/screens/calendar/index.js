// Calendar: meetings you added. Grouped by day, soonest first.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { listMeetingsByIds } from '../../services/bodies.js';

const dayKey = iso => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export async function render(root) {
  root.innerHTML = skeleton(2);
  const now = Date.now();
  const meetings = (await listMeetingsByIds([...state.pins.meeting]))
    .filter(m => new Date(m.startsAt).getTime() >= now);

  const days = new Map();
  meetings.forEach(m => {
    const key = dayKey(m.startsAt);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(m);
  });

  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Calendar</h1>
        <p class="lead">Meetings you added to your calendar.</p>
      </div>
    </header>
    ${days.size
      ? [...days.entries()].map(([day, list]) => `
          <section class="stack" aria-label="${esc(day)}">
            <h2>${esc(day)}</h2>
            ${list.map(m => `
              <article class="card meeting">
                <div class="meeting__head">
                  <div>
                    <p class="meta">${esc(fmtDateTime(m.startsAt))} · <a href="#/body/${esc(m.bodyId)}">${esc(m.bodyName)}</a></p>
                    <h3><a href="#/meeting/${esc(m.id)}">${esc(m.title)}</a></h3>
                  </div>
                  ${pinButton({ kind: 'meeting', id: m.id, name: m.title, pinned: true })}
                </div>
              </article>`).join('')}
          </section>`).join('')
      : empty('No meetings on your calendar yet. Add one from a body or a place.')}`;

  bindPins(root, (kind, id, pinned) => { if (!pinned) render(root); });
}
