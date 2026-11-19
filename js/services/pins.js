// Pins: bodies followed, meetings on the calendar, and items pinned. Each person sees only their own.
import { sb, unwrap } from '../lib/supabase.js';
import { state } from '../state.js';

export async function loadPins(userId) {
  const rows = unwrap(await sb().from('pins').select('kind, target_id').eq('user_id', userId));
  const sets = { body: new Set(), meeting: new Set(), item: new Set() };
  rows.forEach(r => sets[r.kind]?.add(r.target_id));
  state.pins = sets;
  return sets;
}

export async function setPin(userId, kind, targetId, pinned) {
  if (pinned) {
    // Upsert with ignoreDuplicates: a repeat tap or stale state doesn't throw.
    unwrap(await sb().from('pins').upsert(
      { user_id: userId, kind, target_id: targetId },
      { onConflict: 'user_id,kind,target_id', ignoreDuplicates: true },
    ));
    state.pins[kind].add(targetId);
  } else {
    unwrap(await sb().from('pins').delete()
      .eq('user_id', userId).eq('kind', kind).eq('target_id', targetId));
    state.pins[kind].delete(targetId);
  }
}
