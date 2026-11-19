// One meeting: when and where, its agenda items with their stages, and the discussion about the whole meeting.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { STAGE_LABEL } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { getMeeting } from '../../services/bodies.js';
import { listDiscussion } from '../../services/discussions.js';
import { renderDiscussion, bindDiscussion, discussionHtml } from '../../components/discussion.js';

export async function render(root, [id]) {
  root.innerHTML = skeleton(3);
  const meeting = await getMeeting(id);
  if (!meeting) {
    root.innerHTML = `${empty('This meeting could not be found.')}<a class="back" href="#/">Home</a>`;
    return;
  }
  const [comments] = await Promise.all([listDiscussion('meeting', id)]);
  const canPost = state.me.placeIds.includes(meeting.placeId);

  root.innerHTML = `
    <a class="back" href="#/body/${esc(meeting.bodyId)}">${esc(meeting.bodyName)}</a>
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(meeting.bodyName)}</p>
        <h1>${esc(meeting.title)}</h1>
        <p class="lead">${esc(fmtDateTime(meeting.startsAt, true))}${meeting.location ? ` · ${esc(meeting.location)}` : ''}</p>
      </div>
      ${pinButton({ kind: 'meeting', id: meeting.id, name: meeting.title, pinned: state.pins.meeting.has(meeting.id) })}
    </header>

    <p class="links">
      ${meeting.agendaUrl ? `<a href="${esc(meeting.agendaUrl)}" target="_blank" rel="noopener noreferrer">Official agenda</a>` : ''}
      ${meeting.detailsUrl ? `<a href="${esc(meeting.detailsUrl)}" target="_blank" rel="noopener noreferrer">Details and sign-up</a>` : ''}
    </p>

    <section class="stack" aria-labelledby="items-h">
      <h2 id="items-h">Agenda items</h2>
      ${meeting.items.length ? `
        <ul class="rows">
          ${meeting.items.map(i => `
            <li class="row">
              <a class="row__text" href="#/item/${esc(i.id)}">
                <span class="row__name">${esc(i.title)}</span>
                <span class="row__meta">${esc(STAGE_LABEL[i.stage])}${i.outcome ? ` · ${esc(i.outcome)}` : ''}</span>
              </a>
            </li>`).join('')}
        </ul>` : empty('No agenda items posted for this meeting yet.')}
    </section>

    <section class="stack discussion" aria-labelledby="disc-h">
      <h2 id="disc-h">Discussion about this meeting</h2>
      <div id="discussion">${discussionHtml(comments, { scope: 'meeting', id, canPost })}</div>
    </section>`;

  bindPins(root, () => {});
  bindDiscussion(root);
  root.addEventListener('discussion:posted', () => renderDiscussion(root.querySelector('#discussion'), { scope: 'meeting', id, canPost }));
}
