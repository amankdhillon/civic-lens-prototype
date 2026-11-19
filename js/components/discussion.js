// One discussion panel for any scope. Screens render it, bind it once, and refresh it when something is posted.
import { state } from '../state.js';
import { commentListHtml, composerHtml } from './comments.js';
import { toast } from './toast.js';
import { listDiscussion, postDiscussion } from '../services/discussions.js';

export function discussionHtml(comments, { scope, id, canPost }) {
  return `
    <div class="discussion-list">${commentListHtml(comments)}</div>
    ${canPost
      ? composerHtml({ scope, id })
      : '<p class="note">Residents of this place can join the discussion. Everyone can read it.</p>'}`;
}

// Fetches the comments for one scope and fills the container.
export async function renderDiscussion(container, { scope, id, canPost }) {
  const comments = await listDiscussion(scope, id);
  container.innerHTML = discussionHtml(comments, { scope, id, canPost });
}

// Handles posting from the composer inside root. Emits 'discussion:posted' so the screen can refresh.
export function bindDiscussion(root) {
  root.addEventListener('submit', async e => {
    const form = e.target;
    if (form.id !== 'composer') return;
    e.preventDefault();
    const { scope, id } = form.dataset;
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
      await postDiscussion({ userId: state.me.id, scope, id, kind, body, sourceUrl: source });
      toast('Comment posted');
      root.dispatchEvent(new CustomEvent('discussion:posted', { detail: { scope, id } }));
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
