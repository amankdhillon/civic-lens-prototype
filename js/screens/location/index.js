// Where you live. Type an address to narrow the list of fictional sample addresses, then pick one.
// The real address lookup replaces this list once boundary data is loaded.
import { state } from '../../state.js';
import { esc } from '../../lib/dom.js';
import { go } from '../../lib/nav.js';
import { LEVELS } from '../../config.js';
import { listAllBodies } from '../../services/bodies.js';
import { saveLocation, loadMe } from '../../services/auth.js';
import { loadDemoPins } from '../../services/places.js';
import { toast } from '../../components/toast.js';

export async function render(root) {
  const [addresses, bodies] = await Promise.all([loadDemoPins(), listAllBodies()]);
  const boards = bodies.filter(b => b.kind === 'board');

  root.innerHTML = `
    <section class="narrow-col stack">
      <p class="eyebrow">Step 2 of 2</p>
      <h1>Where do you live?</h1>
      <p class="lead">Your address shows your county, U.S. House district, city, local district, and school district. This prototype uses fictional sample addresses, so pick the one closest to yours.</p>

      <form id="location" class="card stack" novalidate>
        <div class="field">
          <label for="addr">Search sample addresses</label>
          <input id="addr" class="input" type="search" autocomplete="off" placeholder="For example, Example Street or District 3">
          <p class="hint">These are fictional. Type part of an address to narrow the list.</p>
        </div>

        <fieldset class="stack" id="address-options">
          <legend>Sample addresses</legend>
          <div id="matches">
            ${addresses.map((a, i) => `
              <label class="choice" data-text="${esc(a.label.toLowerCase())}">
                <input type="radio" name="address" value="${esc(a.id)}" ${i === 0 ? 'checked' : ''}>
                <span><strong>${esc(a.label)}</strong><span class="muted"> · ${esc(a.detail)}</span></span>
              </label>`).join('')}
          </div>
          <p class="empty" id="no-match" hidden>No sample address matches that. Try a different word.</p>
        </fieldset>

        ${boards.length ? `
          <fieldset class="stack">
            <legend>Citywide boards and commissions <span class="muted">(optional)</span></legend>
            <p class="hint">These aren't tied to a location. Choose any you want to follow.</p>
            ${boards.map(b => `
              <label class="choice">
                <input type="checkbox" name="board" value="${esc(b.id)}">
                <span><strong>${esc(b.name)}</strong><span class="muted"> · ${esc(b.scheduleText)}</span></span>
              </label>`).join('')}
          </fieldset>` : ''}

        <div class="row"><button class="btn btn--primary" type="submit">Save my places</button></div>
        <p class="form-error" role="alert"></p>
      </form>
    </section>`;

  const form = root.querySelector('#location');
  const search = root.querySelector('#addr');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    root.querySelectorAll('#matches .choice').forEach(c => {
      const show = !q || c.dataset.text.includes(q);
      c.hidden = !show;
      if (show) visible++;
    });
    root.querySelector('#no-match').hidden = visible > 0;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';
    const data = new FormData(form);
    const address = addresses.find(a => a.id === data.get('address'));
    if (!address) { errorEl.textContent = 'Choose a sample address to continue.'; return; }

    // Governing bodies follow the location. Subcommittees, community groups, and boards are chosen separately.
    const fromLocation = bodies
      .filter(b => b.kind === 'governing' && address.places.includes(b.placeId))
      .map(b => b.id);
    const bodyIds = [...new Set([...fromLocation, ...data.getAll('board')])];

    try {
      await saveLocation(state.me.id, { placeIds: address.places, bodyIds });
      state.me = await loadMe();
      toast('Saved your places');
      go('/');
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
