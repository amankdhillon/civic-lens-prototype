// The single place where the Supabase client is created.
// Screens and services import sb() and unwrap() from here.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

let client = null;
export function sb() {
  if (!client) {
    // Skip the cross-tab lock. Two tabs or a reload can otherwise make the second request fail right away.
    // Acceptable for a class prototype with anonymous sessions. Revisit before real accounts.
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { lock: async (_name, _timeout, fn) => fn() },
    });
  }
  return client;
}

export class AppError extends Error {}

// Turns database and auth messages into something people can act on.
const MESSAGES = [
  ['row-level security', 'Not allowed here. Only residents of this body can comment on its items.'],
  ['item_comments_info_needs_source', 'Information comments need a source link that starts with https://'],
  ['sources_url_https', 'Enter a full link starting with https://'],
  ['Anonymous sign-ins', 'Anonymous sign-ins are off. Turn them on in Supabase: Authentication > Sign In / Providers.'],
  ['Failed to fetch', 'Cannot reach Supabase. Check your internet connection and the project URL in js/config.js.'],
];

export function friendly(message = '') {
  const hit = MESSAGES.find(([needle]) => message.includes(needle));
  return hit ? hit[1] : message;
}

// Unwraps a Supabase { data, error } response, or throws a readable AppError.
export function unwrap(response) {
  if (response.error) throw new AppError(friendly(response.error.message || ''));
  return response.data;
}
