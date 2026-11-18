// Step 2: where the person lives (sample pins for now), plus any citywide boards they want to follow.
// Address lookup replaces the pins once boundary data is loaded.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { go } from '../../lib/nav.js';
import { listAllBodies } from '../../services/bodies.js';
import { saveLocation, loadMe } from '../../services/auth.js';
import { loadDemoPins } from '../../services/places.js';
import { toast } from '../../components/toast.js';

export async function render(root) {
  const [pins, bodies] = await Promise.all([loadDemoPins(), listAllBodies()]);
  const boards = bodies.filter(b => b.kind === 'board');

  root.innerHTML = `
    <section class="narrow-col stack">
      <p class="eyebrow">Step 2 of 2</p>
      <h1>Where do you live in San Diego?</h1>
      <p class="lead">Pick the sample location closest to you. This stands in for address lookup, which needs boundary data first.</p>
      <form id="location" class="card stack">
        <fieldset class="stack">
          <legend>Sample locations</legend>
          ${pins.map((p, i) => `
            <label class="pin">
              <input type="radio" name="pin" value="${esc(p.id)}" ${i === 0 ? 'checked' : ''}>
              <span><strong>${esc(p.label)}</strong><span class="muted"> · ${esc(p.detail)}</span></span>
            </label>`).join('')}
        </fieldset>
        <fieldset class="stack">
          <legend>Citywide boards (optional)</legend>
          <p class="hint">These aren't tied to a location. Choose any you want to follow.</p>
          ${boards.map(b => `
            <label class="checkbox">
              <input type="checkbox" name="board" value="${esc(b.id)}">
              <span><strong>${esc(b.name)}</strong><span class="muted"> · ${esc(b.scheduleText)}</span></span>
            </label>`).join('')}
        </fieldset>
        <div class="row"><button class="btn btn--primary" type="submit">Save my location</button></div>
        <p class="form-error" role="alert"></p>
      </form>
    </section>`;

  root.querySelector('#location').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const errorEl = form.querySelector('.form-error');
    const data = new FormData(form);
    const pin = pins.find(p => p.id === data.get('pin'));
    if (!pin) { errorEl.textContent = 'Pick a location to continue.'; return; }

    // Governing bodies follow the location. Boards only come from the checkboxes.
    const fromLocation = bodies
      .filter(b => b.kind !== 'board' && pin.places.includes(b.placeId))
      .map(b => b.id);
    const bodyIds = [...new Set([...fromLocation, ...data.getAll('board')])];

    try {
      await saveLocation(state.me.id, { placeIds: pin.places, bodyIds });
      state.me = await loadMe();
      toast('Saved your location');
      go('/');
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
