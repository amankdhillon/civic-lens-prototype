// Shared state: the signed-in profile, its pins, and startup status.
export const state = {
  me: null,                 // { id, nickname, bodyIds, placeIds, verified... } or null before joining
  bootError: null,          // set if the connection failed at startup
  pins: {                   // Sets of ids the person has pinned, by kind
    body: new Set(),        // bodies they follow
    meeting: new Set(),     // meetings on their calendar
    item: new Set(),        // agenda items they pinned
  },
};
