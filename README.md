# Civic Lens (Prototype)

Helps people see which governing bodies affect them, when they meet, what is on each agenda, where each item stands, and how to talk about it with neighbors.

## Redesign (current)
Home shows upcoming meetings and agenda items beside active discussions across items, meetings, bodies, community groups, and places. Places list governing bodies by level, subcommittees under their parent, community groups, boards, representation, and place discussion. Meetings have their own page with a discussion. Discussions use one shared panel (`components/discussion.js`) and one service (`services/discussions.js`).

Run `supabase/migration-5.sql` after migration-4. It adds fictional U.S. House and state senate districts, subcommittees, community groups, and the discussion tables.

## Status
Working:
- Nickname sign-in (no password)
- Location step with three sample pins across San Diego council districts, plus optional citywide boards
- Home: your places and your bodies, with each body's next meeting
- Place pages (city, council district, county, school area): bodies grouped by level of government, joinable with a plus or check button, plus representation and upcoming community meetings
- Body pages: upcoming and recent meetings with their agenda items
- Item pages: who decides, approval path, stage, what it decides, how to comment, and the discussion (members of the body can comment)
- Sign out

Not built yet (planned for later waves):
- Calendar and pinned bodies
- Address lookup (needs real boundary files; the pins stand in for it)
- Member and staff details (fields exist; names are empty)
- Moderation tools (reporting, hiding, moderator queue) for discussions
- Text and email alerts, Spanish translations

Sample data only: bodies, agenda items, community meetings, and boundaries are placeholders, except the board names and schedule wording checked against sandiego.gov.

## Set up
1. Create a SEPARATE Supabase project for Civic Lens.
2. Turn on anonymous sign-ins (Authentication > Sign In / Providers).
3. Run in the SQL Editor, in order: `supabase/schema.sql`, `supabase/seed-bodies.sql`, `supabase/migration-2.sql`, `supabase/migration-3.sql`, `supabase/seed-places.sql`.
4. Put the project URL and publishable key in `js/config.js`.
5. Load agendas with `tools/import-agenda.mjs` (see `tools/README.md`).
6. Host the folder on GitHub Pages. The repository's top level should contain `index.html`, `css/`, `js/`, `data/`, and `supabase/`.

## Check the connection
Open `#/check` on the site. It runs each data query the screens use and reports any failure with the database message.

## Structure
    index.html          Shell: top bar, rail, toasts, modal, one script tag
    css/                Shared tokens, base, layout, components, and civic.css (screens)
    js/
      app.js            Boot: connect, load the profile, account corner, rail
      router.js         Route table and guards. Add screens here.
      config.js         Connection values, levels, stages, comment kinds, comment template
      state.js          Signed-in profile
      lib/              Supabase client, geocoder, formatting, routing, DOM helpers
      services/         All data reads and writes: auth, bodies, comments, places
      components/       Rail, icons, join button, stage steps, comments, cards, toasts
      screens/          One folder per screen, each exporting render(root, params)
        welcome/        Nickname
        location/       Sample pins and optional boards
        home/           Your places and bodies
        place/          One place, bodies grouped by level, joining
        body/           One body: meetings and agenda items
        item/           One agenda item: decision, status, how to comment, discussion
        check/          Data check (not linked from the site)
    supabase/           Schema, seeds, and migrations, run in order
    tools/              Agenda import (uses the secret key on your computer only)
    data/               Sample pins and agenda files; boundary files go in data/boundaries/
    docs/               Data sources and what to verify before scaling

## Rules
- Screens read and write data only through `services/`.
- The database enforces permissions. The page only shows what's allowed.
- Addresses are never stored. Only the place and body ids a person chooses are saved.
- The stage shown is what the agenda says, labeled that way until it's checked against the official record.
- Auth uses a no-op lock in `js/lib/supabase.js`. This suits a single-tab class prototype. Remove it before real accounts are used.
