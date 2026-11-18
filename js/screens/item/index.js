// One agenda item. Top to bottom: what it is, who decides, where it stands, how to comment, then the discussion.
// Residents of the body can comment. Everyone can read.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { fmtDateTime } from '../../lib/format.js';
import { COMMENT_TEMPLATE } from '../../config.js';
import { getItem } from '../../services/bodies.js';
import { listComments, addComment } from '../../services/comments.js';
import { stageSteps } from '../../components/stages.js';
import { commentListHtml, composerHtml } from '../../components/comments.js';
import { skeleton, empty } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

function howToComment(item) {
  const m = item.meeting;
  const deadline = item.commentDeadline
    ? `Deadline: ${esc(fmtDateTime(item.commentDeadline, true))}.`
    : 'The agenda lists the comment deadline.';
  return `
    <details class="how-to">
      <summary>How to comment at a meeting</summary>
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
  const comments = await listComments(id);
  const m = item.meeting;
  const canComment = state.me.bodyIds.includes(m.bodyId);

  const links = [
    item.sourceUrl && `<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the official item</a>`,
    m.watchUrl && `<a href="${esc(m.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch the meeting</a>`,
  ].filter(Boolean).join(' · ');

  root.innerHTML = `
    <a class="back" href="#/body/${esc(m.bodyId)}">${esc(m.bodyName)}</a>
    <article class="item stack">
      <p class="meta">${esc(fmtDateTime(m.startsAt, true))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
      <h1>${esc(item.title)}</h1>
      <p><strong>Who decides:</strong> ${item.decidedBy ? esc(item.decidedBy) : 'not yet confirmed'}</p>
      ${item.approvalPath.length ? `<p class="path">Path: ${item.approvalPath.map(esc).join(' → ')}</p>` : ''}
      ${stageSteps(item.stage)}
      ${item.stageBasis !== 'official'
        ? '<p class="note">The stage comes from the agenda. It hasn\'t been checked against the official record yet.</p>'
        : ''}
      ${item.summary ? `<p>${esc(item.summary)}</p>` : ''}
      ${item.whatItDecides ? `<h2>What this decides</h2><p>${esc(item.whatItDecides)}</p>` : ''}
      ${item.whoItAffects ? `<h2>Who it affects</h2><p>${esc(item.whoItAffects)}</p>` : ''}
      ${item.outcome ? `<h2>Outcome</h2><p>${esc(item.outcome)}</p>` : ''}
      <p class="note">${item.verifiedAt
        ? `Source checked ${esc(fmtDateTime(item.verifiedAt, true))}.`
        : 'Not yet checked against the official record.'}</p>
      ${links ? `<p class="links">${links}</p>` : ''}
      ${howToComment(item)}
    </article>
    <section class="discussion stack" aria-labelledby="discussion-h">
      <h2 id="discussion-h" tabindex="-1">Discussion</h2>
      <div id="comments">${commentListHtml(comments)}</div>
      ${canComment ? composerHtml() : '<p class="note">Residents of this body can comment. Everyone can read.</p>'}
    </section>`;

  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="copy"]');
    if (!btn) return;
    navigator.clipboard?.writeText(COMMENT_TEMPLATE)
      .then(() => toast('Template copied'))
      .catch(() => toast('Could not copy. Select the template text instead.', 'error'));
  });

  root.addEventListener('submit', async e => {
    if (e.target.id !== 'composer') return;
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const kind = data.get('kind');
    const body = String(data.get('body') || '').trim();
    const source = String(data.get('source') || '').trim();
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';

    if (!body) { errorEl.textContent = 'Write your comment first.'; return; }
    if (kind === 'information' && !/^https:\/\/\S+$/.test(source)) {
      errorEl.textContent = 'Information comments need a source link that starts with https://';
      return;
    }
    try {
      await addComment({ userId: state.me.id, itemId: id, kind, body, sourceUrl: source });
      root.querySelector('#comments').innerHTML = commentListHtml(await listComments(id));
      form.reset();
      toast('Comment posted');
      root.querySelector('#discussion-h').focus();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
