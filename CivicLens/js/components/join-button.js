// A plus to join, a check when joined. The label names what the button joins; aria-pressed carries the state.
import { esc } from '../lib/dom.js';
import { svg } from './icons.js';

export function joinButton({ kind, id, name, joined }) {
  return `
    <button type="button" class="join" data-action="toggle" data-kind="${esc(kind)}" data-id="${esc(id)}"
      aria-pressed="${joined}" aria-label="${joined ? 'Leave' : 'Join'} ${esc(name)}" title="${joined ? 'Joined' : 'Join'}">
      ${svg(joined ? 'check' : 'plus')}
    </button>`;
}
