// One agenda item: who decides, where it stands, what it means, how to take part, and the discussion about it.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { COMMENT_TEMPLATE } from '../../config.js';
import { skeleton, empty } from '../../components/ui.js';
import { pinButton, bindPins } from '../../components/pin-button.js';
import { toast } from '../../components/toast.js';
import { getItem } from '../../services/bodies.js';
import { listDiscussion } from '../../services/discussions.js';
import { stageSteps } from '../../components/stages.js';
import { renderDiscussion, bindDiscussion, discussionHtml } from '../../components/discussion.js';

function howToTakePart(item) {
  const m = item.meeting;
  const deadline = item.commentDeadline
    ? `Deadline: ${esc(fmtDateTime(item.commentDeadline, true))}.`
    : 'The agenda lists the comment deadline.';
  return `
    <details class="how-to">
      <summary>How to comment at the meeting</summary>
      <p>${deadline} Public comment goes through the body's own channel. The agenda lists the link and the time limit.</p>
      ${m.commentGuide ? `<p>${esc(m.commentGuide)}</p>` : ''}
      <pre class="template">${esc(COMMENT_TEMPLATE)}</pre>
      <button type="button" class="btn btn--ghost btn--sm" data-action="copy">Copy template</button>
    </details>`;
}

export async function render(root, [id]) {
  root.innerHTML = skeleton(3);
  const item = await getItem(id);
  if (!item) {
    root.innerHTML = empty('This agenda item could not be found.');
    return;
  }
  const comments = await listDiscussion('item', id);
  const m = item.meeting;
  const canPost = state.me.bodyIds.includes(m.bodyId) || state.me.placeIds.includes(m.placeId);

  const links = [
    item.sourceUrl && `<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the official item</a>`,
    m.watchUrl && `<a href="${esc(m.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch the meeting</a>`,
  ].filter(Boolean);

  root.innerHTML = `
    <a class="back" href="#/meeting/${esc(m.id)}">${esc(m.title)}</a>
    <header class="page-head">
      <div>
        <p class="eyebrow">${esc(m.bodyName)} · ${esc(fmtDateTime(m.startsAt, true))}</p>
        <h1>${esc(item.title)}</h1>
      </div>
      ${pinButton({ kind: 'item', id: item.id, name: item.title, pinned: state.pins.item.has(item.id) })}
    </header>

    <section class="card stack" aria-labelledby="stage-h">
      <h2 id="stage-h">Where it stands</h2>
      <p><strong>Who decides:</strong> ${item.decidedBy ? esc(item.decidedBy) : 'not yet confirmed'}</p>
      ${item.approvalPath.length ? `<p class="path">Path: ${item.approvalPath.map(esc).join(' → ')}</p>` : ''}
      ${stageSteps(item.stage)}
      ${item.stageBasis !== 'official'
        ? '<p class="note">The stage comes from the agenda. It hasn\'t been checked against the official record yet.</p>'
        : ''}
    </section>

    <section class="card stack" aria-labelledby="what-h">
      <h2 id="what-h">What this means</h2>
      ${item.summary ? `<p>${esc(item.summary)}</p>` : ''}
      ${item.whatItDecides ? `<p><strong>What it decides:</strong> ${esc(item.whatItDecides)}</p>` : ''}
      ${item.whoItAffects ? `<p><strong>Who it affects:</strong> ${esc(item.whoItAffects)}</p>` : ''}
      ${item.outcome ? `<p><strong>Outcome:</strong> ${esc(item.outcome)}</p>` : ''}
      <p class="note">${item.verifiedAt
        ? `Source checked ${esc(fmtDateTime(item.verifiedAt, true))}.`
        : 'Not yet checked against the official record.'}</p>
      ${links.length ? `<p class="links">${links.join(' · ')}</p>` : ''}
      ${howToTakePart(item)}
    </section>

    <section class="stack discussion" aria-labelledby="disc-h">
      <h2 id="disc-h">Discussion about this item</h2>
      <div id="discussion">${discussionHtml(comments, { scope: 'item', id, canPost })}</div>
    </section>`;

  bindPins(root, () => {});
  bindDiscussion(root);
  root.addEventListener('discussion:posted', () => renderDiscussion(root.querySelector('#discussion'), { scope: 'item', id, canPost }));
  root.addEventListener('click', e => {
    if (!e.target.closest('[data-action="copy"]')) return;
    navigator.clipboard?.writeText(COMMENT_TEMPLATE)
      .then(() => toast('Template copied'))
      .catch(() => toast('Could not copy. Select the template text instead.', 'error'));
  });
}
