# San Diego data sources

What each source is for, what it provides, and what still has to be checked before we rely on it.

## Checked
- **City boards and commissions list** (sandiego.gov/boards-and-commissions/list). Each entry gives the name, address, a schedule sentence (for example "meets the fourth Thursday"), an agendas-and-minutes link, a duties link, and a website. The schedule is free text, so a person enters it or we parse it carefully. It isn't machine-readable.
- **City council districts.** The city's footer lists nine districts, each linking to a council member page (sandiego.gov/citycouncil/cd1 through cd9). Member names change, so the prototype leaves them empty.

## Reference, not yet inspected
- **City council agendas** (sandiego.hylandcloud.com/211agendaonlinecouncil). An agenda portal. We need its structure before writing an adapter: how meetings are listed, where items and attachments live, and whether it offers a feed.
- **City council meetings calendar** (sandiego.gov/city-clerk/officialdocs/meetings-calendar). The source of truth for meeting dates.
- **City events calendar** (sandiego.gov/events/calendar). A possible source for community meetings, but events mix city and non-city activity, so each one needs a check.
- **San Diego Unified board meetings** (simbli.eboardsolutions.com). The district's meeting platform. Check its listing format before writing an adapter.
- **San Diego Unified board of education** (sandiegounified.org/about/board_of_education). Board roster and policy pages.
- **County departments** (sandiegocounty.gov/departments). The county has its own boards, agendas, and districts. Confirm the county board's district structure and its agenda source.

## Rules for every source
- Store the source link and the date it was checked on every record.
- Keep official text and facts apart from summaries. Summaries are written by a person and reviewed.
- Community meetings come from the organizer or an official calendar. Each one links to the organizer's sign-up page.
- Don't hardcode member names, meeting dates, or boundaries. They change, and the import should update them.

## Corrections to earlier planning
- The city has **nine** council districts, not seven.
- Districts 1 to 9 each need an official, a page, and a list of community meetings. The prototype starts with three.
