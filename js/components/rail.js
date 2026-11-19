// Navigation: a side rail on wide screens, a bottom bar on phones. Shown only after sign-in.
import { state } from '../state.js';
import { currentPath } from '../lib/nav.js';
import { svg } from './icons.js';

const ITEMS = [
  { href: '/', label: 'Feed', icon: 'home', match: p => p === '/' || p.startsWith('/body') || p.startsWith('/item') },
  { href: '/places', label: 'Places', icon: 'map', match: p => p.startsWith('/place') },
  { href: '/calendar', label: 'Calendar', icon: 'calendar', match: p => p === '/calendar' },
  { href: '/pinned', label: 'Pinned', icon: 'star', match: p => p === '/pinned' },
];

export function renderRail() {
  const rail = document.getElementById('rail');
  if (!state.me?.state) { rail.innerHTML = ''; return; }
  const path = currentPath();
  rail.innerHTML = ITEMS.map(i => `
    <a href="#${i.href}" ${i.match(path) ? 'aria-current="page"' : ''}>
      ${svg(i.icon, 22)}<span>${i.label}</span>
    </a>`).join('');
}
