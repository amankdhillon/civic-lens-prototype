// Comment list and composer. The composer knows which discussion it belongs to through data attributes.
import { esc } from '../lib/dom.js';
import { fmtDateTime } from '../lib/format.js';
import { COMMENT_KINDS } from '../config.js';

const KIND_LABEL = Object.fromEntries(COMMENT_KINDS.map(k => [k.value, k.label]));

export function commentListHtml(comments) {
  if (!comments.length) return '<p class="empty">No comments yet. A question is a good place to start.</p>';
  return `<ol class="comments">
    ${comments.map(c => `
      <li class="comment">
        <p class="comment__meta"><strong>${esc(c.authorName)}</strong> <span class="tag">${esc(KIND_LABEL[c.kind])}</span> <span class="muted">${esc(fmtDateTime(c.createdAt))}</span></p>
        <p class="comment__body">${esc(c.body)}</p>
        ${c.sourceUrl ? `<p><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></p>` : ''}
      </li>`).join('')}
  </ol>`;
}

export function composerHtml({ scope, id }) {
  return `
    <form id="composer" class="composer" data-scope="${esc(scope)}" data-id="${esc(id)}">
      <div class="field">
        <label for="c-kind">Type of comment</label>
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
