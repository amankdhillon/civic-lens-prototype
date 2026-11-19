// Step 1: a nickname. No password.
import { state } from '../../state.js';
import { createProfile, loadMe } from '../../services/auth.js';
import { go } from '../../lib/nav.js';

export function render(root) {
  if (state.me) return go(state.me.placeIds.length ? '/' : '/location');

  root.innerHTML = `
    <section class="narrow-col stack">
      <h1>See who decides what affects you, and when</h1>
      <p class="lead">Find the bodies that govern where you live, follow their meetings, and talk with neighbors about the items that matter. No password, just a nickname.</p>
      <form id="join" class="card stack" novalidate>
        <div class="field">
          <label for="nick">Nickname</label>
          <input id="nick" name="nickname" class="input" maxlength="30" autocomplete="off" required aria-describedby="nick-hint">
          <p id="nick-hint" class="hint">Other people will see this name.</p>
        </div>
        <button class="btn btn--primary btn--block" type="submit">Continue</button>
        <p class="form-error" role="alert"></p>
      </form>
    </section>`;

  const form = root.querySelector('#join');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = form.querySelector('.form-error');
    const submit = form.querySelector('button[type="submit"]');
    const nickname = String(new FormData(form).get('nickname') || '').trim();
    errorEl.textContent = '';
    if (!nickname) { errorEl.textContent = 'Enter a nickname to continue.'; form.querySelector('#nick').focus(); return; }

    submit.disabled = true;
    try {
      await createProfile(nickname);
      state.me = await loadMe();
      go('/location');
    } catch (err) {
      errorEl.textContent = err.message;
      submit.disabled = false;
    }
  });
}
