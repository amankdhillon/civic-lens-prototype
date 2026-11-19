# Civic Lens (Prototype)

Helps people see which governing bodies affect them, when those bodies meet, what is on each agenda, where each item stands, and how to talk about it with neighbors.

## Set up
1. Create a SEPARATE Supabase project for Civic Lens.
2. Turn on anonymous sign-ins (Authentication > Sign In / Providers).
3. Run in the SQL Editor, in order: `supabase/schema.sql`, `supabase/seed-bodies.sql`, `supabase/migration-2.sql`.
4. Put the project URL and publishable key in `js/config.js`.
5. Load agendas: see `tools/README.md`.
6. Host the folder on GitHub Pages or any static host.

## Structure
    index.html          Shell: top bar, toasts, modal, one script tag
    css/                Shared tokens, base, layout, components, and civic.css (screens)
    js/
      app.js            Boot: connect, load the profile, account corner
      router.js         Route table and guards. Add screens here.
      config.js         Connection values, levels, stages, comment kinds, comment template
      state.js          Signed-in profile
      lib/              Supabase client, geocoder, formatting, routing helpers, DOM helpers
      services/         All data reads and writes: auth, bodies, comments
      components/       Shared pieces: stage steps, comment list and composer, cards, toasts
      screens/          One folder per screen, each with render(root, params)
        welcome/        Nickname
        address/        Find bodies from an address, or pick from a list
        home/           Your bodies and their next meeting
        body/           One body: upcoming and recent meetings
        item/           One agenda item: decision, status, how to comment, discussion
    supabase/           Schema, seed, and migrations (run in order)
    tools/              Agenda import (uses the secret key on your computer only)
    data/agendas/       Agenda files (sample.json is sample data)
    data/boundaries/    Body boundary files for address matching

## Rules that keep it modular
- A screen reads and writes data only through `services/`. Screens don't call Supabase directly.
- A screen owns its markup. Shared pieces go in `components/`, and a piece used by two screens moves there.
- Each screen attaches its event listeners to its own root element. Routing replaces that element, so listeners never leak between screens.
- The database enforces permissions (who can comment, who can read addresses). The page only shows what is allowed.
- The stage shown is what the agenda says, labeled that way until it is checked against the official record.
- Addresses are never stored. Only the body ids a person chooses are saved.
