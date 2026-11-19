// Pinned: the bodies you follow, meetings on your calendar, and items you pinned. Each can be removed here.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { listAllBodies, getItem } from '../../services/bodies.js';

export async function render(root) {
  root.innerHTML = skeleton(3);
  const [bodies, items] = await Promise.all([
    listAllBodies(),
    Promise.all([...state.pins.item].map(id => getItem(id))),
  ]);
  const followed = bodies.filter(b => state.pins.body.has(b.id));
  const pinnedItems = items.filter(Boolean);

  root.innerHTML = `
    <header class="page-head">
      <div>
        <h1>Pinned</h1>
        <p class="lead">Bodies you follow and items you pinned. Remove any of them here.</p>
      </div>
    </header>

    <section class="stack" aria-labelledby="bodies-h">
      <h2 id="bodies-h">Bodies you follow</h2>
      ${followed.length ? `
        <ul class="rows">
          ${followed.map(b => `
            <li class="row">
              <a class="row__text" href="#/body/${esc(b.id)}">
                <span class="row__name">${esc(b.name)}</span>
                <span class="row__meta">${esc(b.scheduleText || 'Schedule not listed yet')}</span>
              </a>
              ${pinButton({ kind: 'body', id: b.id, name: b.name, pinned: true })}
            </li>`).join('')}
        </ul>` : empty('You aren\'t following any bodies yet.')}
    </section>

    <section class="stack" aria-labelledby="items-h">
      <h2 id="items-h">Pinned items</h2>
      ${pinnedItems.length ? `
        <ul class="rows">
          ${pinnedItems.map(i => `
            <li class="row">
              <a class="row__text" href="#/item/${esc(i.id)}">
                <span class="row__name">${esc(i.title)}</span>
                <span class="row__meta">${esc(i.meeting.bodyName)} · ${esc(STAGE_LABEL[i.stage])}</span>
              </a>
              ${pinButton({ kind: 'item', id: i.id, name: i.title, pinned: true })}
            </li>`).join('')}
        </ul>` : empty('No items pinned yet. Pin an agenda item to keep track of it.')}
    </section>

    <p class="row__meta"><a href="#/calendar">Open your calendar</a></p>`;

  bindPins(root, () => {});
}
