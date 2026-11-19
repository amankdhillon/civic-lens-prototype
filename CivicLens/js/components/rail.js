// Navigation: a side rail on wide screens, a bottom bar on phones. Same markup, styled by CSS.
import { currentPath } from '../lib/nav.js';
import { svg } from './icons.js';

export function renderRail() {
  const rail = document.getElementById('rail');
  const path = currentPath();
  const item = (href, label, icon, active) => `
    <a href="#${href}" ${active ? 'aria-current="page"' : ''}>
      ${svg(icon, 22)}<span>${label}</span>
    </a>`;
  const soon = (label, icon) => `
    <span class="soon" aria-disabled="true">
      ${svg(icon, 22)}<span>${label}</span><span class="sr-only">, coming soon</span>
    </span>`;

  rail.innerHTML = [
    item('/', 'Home', 'home', path === '/' || path.startsWith('/body') || path.startsWith('/item')),
    item('/', 'Places', 'star', path.startsWith('/place')),
    soon('Calendar', 'calendar'),
    soon('Pinned', 'star'),
  ].join('');
}
