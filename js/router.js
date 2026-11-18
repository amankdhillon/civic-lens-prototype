// Route table and renderer.
// To add a screen: create js/screens/<name>/index.js exporting render(root, params), then add one entry below.
// need: 'none' (anyone), 'profile' (joined), 'ready' (joined and has bodies).
import { state } from './state.js';
import { currentPath, go } from './lib/nav.js';
import { esc } from './lib/dom.js';
import { friendly } from './lib/supabase.js';
import { card } from './components/ui.js';
import * as welcome from './screens/welcome/index.js';
import * as address from './screens/address/index.js';
import * as home from './screens/home/index.js';
import * as body from './screens/body/index.js';
import * as item from './screens/item/index.js';

export const routes = [
  { path: '/welcome', need: 'none', screen: welcome },
  { path: '/address', need: 'profile', screen: address },
  { path: '/', need: 'ready', screen: home },
  { path: '/body/:id', need: 'ready', screen: body },
  { path: '/item/:id', need: 'ready', screen: item },
];

// '/item/:id' becomes a pattern that captures the id. params[0] is the id.
const compile = path => new RegExp('^' + path.replace(/:\w+/g, '([\\w-]+)') + '$');
const compiled = routes.map(r => ({ ...r, pattern: compile(r.path) }));

function find(path) {
  for (const r of compiled) {
    const match = r.pattern.exec(path);
    if (match) return { route: r, params: match.slice(1) };
  }
  return { route: compiled.find(r => r.path === '/'), params: [] };
}

// Returns true if the route may open. Otherwise it sends the person to the next step.
function allowed(need) {
  if (need === 'none') return true;
  if (!state.me) { go('/welcome'); return false; }
  if (need === 'profile') return true;
  if (!state.me.bodyIds.length) { go('/address'); return false; }
  return true;
}

let cleanup = null;
let token = 0;

export async function renderRoute(app) {
  const mine = ++token;
  if (cleanup) { cleanup(); cleanup = null; }

  const { route, params } = find(currentPath());
  const root = document.createElement('div');
  root.className = 'screen';
  app.replaceChildren(root);

  if (state.bootError) {
    root.innerHTML = card({
      title: 'Civic Lens could not connect',
      body: `<p>${esc(friendly(state.bootError.message))}</p>
             <p class="note">Check the project URL and key in js/config.js.</p>`,
    });
    return;
  }
  if (!allowed(route.need)) return;

  try {
    const stop = await route.screen.render(root, params);
    if (mine !== token) { if (typeof stop === 'function') stop(); return; }
    cleanup = typeof stop === 'function' ? stop : null;
  } catch (e) {
    root.innerHTML = card({
      title: 'Something went wrong',
      body: `<p>${esc(friendly(e.message))}</p><a class="btn btn--ghost" href="#/">Back to your government</a>`,
    });
  }
}

export function startRouter(app) {
  const again = () => renderRoute(app);
  window.addEventListener('hashchange', again);
  window.addEventListener('route:refresh', again);
  return again();
}
