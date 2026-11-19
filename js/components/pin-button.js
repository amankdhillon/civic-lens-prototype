// One control for follow, calendar, pin, and join. A plus adds, a check removes. The label says what it does.
import { esc } from '../lib/dom.js';
import { svg } from './icons.js';
import { state } from '../state.js';
import { setPin } from '../services/pins.js';
import { announce, toast } from './toast.js';

const VERBS = {
  body: ['Follow', 'Unfollow'],
  meeting: ['Add to calendar', 'Remove from calendar'],
  item: ['Pin', 'Unpin'],
  district: ['Join', 'Leave'],
};

// Kinds this module can pin. Districts are joined on the place page instead.
const PINNABLE = ['body', 'meeting', 'item'];

const labelFor = (kind, name, pinned) => `${VERBS[kind][pinned ? 1 : 0]} ${name}`;

export function pinButton({ kind, id, name, pinned, action = 'pin' }) {
  return `
    <button type="button" class="pin-btn" data-action="${esc(action)}" data-kind="${esc(kind)}"
      data-id="${esc(id)}" data-name="${esc(name)}" aria-pressed="${pinned}"
      aria-label="${esc(labelFor(kind, name, pinned))}" title="${esc(VERBS[kind][pinned ? 1 : 0])}">
      ${svg(pinned ? 'check' : 'plus')}
    </button>`;
}

export function setPinButton(btn, pinned) {
  const { kind, name } = btn.dataset;
  btn.setAttribute('aria-pressed', String(pinned));
  btn.setAttribute('aria-label', labelFor(kind, name, pinned));
  btn.title = VERBS[kind][pinned ? 1 : 0];
  btn.innerHTML = svg(pinned ? 'check' : 'plus');
}

// Listens once per screen for pin toggles. onChange runs after a successful save.
export function bindPins(root, onChange) {
  root.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="pin"]');
    if (!btn) return;
    const { kind, id, name } = btn.dataset;
    if (!PINNABLE.includes(kind)) return;
    const pinned = !state.pins[kind].has(id);
    btn.disabled = true;
    try {
      await setPin(state.me.id, kind, id, pinned);
      setPinButton(btn, pinned);
      announce(`${pinned ? 'Added' : 'Removed'} ${name}`);
      onChange?.(kind, id, pinned);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
