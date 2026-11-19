// Entry point: connects, loads the signed-in profile, shows the account corner, and starts the router.
import { state } from './state.js';
import { ensureSession, loadMe, signOut } from './services/auth.js';
import { toast } from './components/toast.js';
import { go } from './lib/nav.js';
import { esc } from './lib/dom.js';
import { SUPABASE_URL } from './config.js';
import { startRouter } from './router.js';
import { renderRail } from './components/rail.js';

const app = document.getElementById('app');
const corner = document.getElementById('me');

function paintCorner() {
  corner.innerHTML = state.me
    ? `<span class="me__name">${esc(state.me.nickname)}</span>
       <button class="link" type="button" id="signout">Sign out</button>`
    : '';
}

corner.addEventListener('click', async e => {
  if (!e.target.closest('#signout')) return;
  try {
    await signOut();
    await ensureSession();
    state.me = null;
    toast('Signed out');
    go('/welcome');
  } catch (err) {
    toast(err.message, 'error');
  }
});

window.addEventListener('hashchange', () => { paintCorner(); renderRail(); });

async function boot() {
  if (!location.hash) history.replaceState(null, '', '#/');
  if (SUPABASE_URL.includes('YOUR-')) {
    state.bootError = new Error('The project URL is still a placeholder.');
  } else {
    try {
      await ensureSession();
      state.me = await loadMe();
    } catch (e) {
      state.bootError = e;
    }
  }
  paintCorner();
  renderRail();
  startRouter(app);
}

boot();
