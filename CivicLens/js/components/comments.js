// Comments on an agenda item: the list, and the form residents use to add one.
import { esc } from '../lib/dom.js';
import { fmtDateTime } from '../lib/format.js';
import { COMMENT_KINDS } from '../config.js';

const KIND_LABEL = Object.fromEntries(COMMENT_KINDS.map(k => [k.value, k.label]));

export function commentListHtml(comments) {
  if (!comments.length) return '<p class="empty">No comments yet. A question helps neighbors too.</p>';
  return `<ol class="comments">
    ${comments.map(c => `
      <li class="comment">
        <p class="meta"><strong>${esc(c.authorName)}</strong> <span class="tag">${esc(KIND_LABEL[c.kind])}</span> ${esc(fmtDateTime(c.createdAt))}</p>
        <p class="comment__body">${esc(c.body)}</p>
        ${c.sourceUrl ? `<p><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></p>` : ''}
      </li>`).join('')}
  </ol>`;
}

export function composerHtml() {
  return `
    <form id="composer" class="composer">
      <div class="field">
        <label for="c-kind">Type</label>
        <select id="c-kind" name="kind" class="input">
          ${COMMENT_KINDS.map(k => `<option value="${esc(k.value)}">${esc(k.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="c-text">Your comment</label>
        <textarea id="c-text" name="body" class="input" rows="3" required></textarea>
      </div>
      <div class="field">
        <label for="c-source">Source link <span class="muted">(required for information)</span></label>
        <input id="c-source" name="source" class="input" type="url" placeholder="https://">
      </div>
      <div class="row"><button class="btn btn--primary" type="submit">Post comment</button></div>
      <p class="form-error" role="alert"></p>
    </form>`;
}
