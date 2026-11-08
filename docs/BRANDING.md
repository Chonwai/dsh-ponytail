# Naming and branding

Decision recorded 2026-11-09, revised the same day after a naming study kept in the maintainer's
notes. Availability checks used `npm view`,
the npm registry HTTP API and `gh search repos`; they describe what was visible on that date, not
trademark clearance.

## The decision

| Thing | Name | |
|---|---|---|
| npm package | `@chonwai/dsh-rein` | renamed from `@chonwai/dsh-ponytail` before the first publish |
| GitHub repository | `Chonwai/dsh-rein` | renamed; GitHub redirects the old URL |
| Display name | **Rein — Ponytail for DeepSeek Harness** | README hero, locale title, registry entries |
| Bundle row id | `rein` (prompt section `rein-rules`) | renamed in `cordis.patch.yml` and the host half |
| Maintainer brand | **Chonwai** | `@chonwai` scope, byline, future `@chonwai/dsh-*` family |
| Skills, user gestures, pill text | `ponytail*`, `/ponytail*`, "Ponytail" | **never renamed** — upstream content, MIT |
| Upstream attribution | `NOTICE` + README | **never removed** |

One sentence used everywhere: *"Rein — Ponytail for DeepSeek Harness: a verified, reversible bundle
by Chonwai. Six skills, a scoped always-on ruleset, a composer pill; MIT, no dependencies."*

## Why the rename (evidence, 2026-11-09)

- GitHub has **19 repositories named exactly `dsh-ponytail`** (the largest has 40 stars). Ours was
  the 19th; a slug cannot become an identity inside that crowd.
- npm has `dsh-ponytail` (0.2.0) and `ponytail-dsh` (0.1.0), both other ports. The stand-alone words
  `saddle`, `bridle`, `pony-express`, `farrier` and `lasso` are taken as npm names as well.
- `dsh-rein` / `@chonwai/dsh-rein` were free (registry 404, no exact-name repository). The name reads
  as "rein in over-engineering" and continues the pony/horse-gear metaphor without claiming the
  upstream project.
- The rename window is cheap only now: the package was unpublished (`private: true`) and the
  repository had no inbound links. After an npm publish a package cannot be renamed, only replaced.

## What the study compared

Three candidates were scored against seven criteria (searchability, ownability, clarity, confusion
and trademark risk, ecosystem convention, rename cost, brand extensibility): **Rein 83.0**, keeping
the old name with a display brand 81.0, **Farrier 80.0**. The gap between the first two is small; the
deciding factor was ownability, because a 19-way collision cannot be undone later while a display
brand can always be added later.

## Keeping the Ponytail name visible (the slug stays Rein)

GitHub's repository search reads **name, description and topics by default**; the README only counts
with `in:readme` ([GitHub docs, searched 2026-11-09](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories)).
npm search behaves the same way for name, description and keywords — observed through the registry
search API on 2026-11-09: the packages that rank for "ponytail deepseek harness" carry `ponytail` in
their keywords and description. So the question is not "is Ponytail in the slug" but "does every
searchable field still carry it".

Baseline, measured on 2026-11-09 **before** the GitHub description gained "Formerly dsh-ponytail"
(repository is new, 0 stars):

| Query | Matches | Our position |
|---|---:|---|
| `ponytail dsh` (default fields) | 42 | **41st** |
| `ponytail dsh in:description` | 17 | 15th |
| `topic:dsh topic:ponytail` | 13 | 13th |
| `rein ponytail` | 1 | **1st** |
| `"Ponytail for DeepSeek Harness"` | 1 | **1st** |
| `ponytail dsh in:name` | 32 | absent (no Ponytail in the slug) |

After that description update (02:50 CST, same day) the same queries returned `ponytail dsh` → #34 of
42, `dsh-ponytail` → #35, and `ponytail dsh in:description` → #7 of 17; totals unchanged, positions
move with stars, links and age.

The honest reading: we are *matchable* through description and topics, but ranked last because the
repository has no stars, no inbound links and no age. Adding `ponytail` to the slug would put us in
the 32-entry `in:name` set, where the same popularity ranking applies; it would not buy the top spot,
and it would make the package read as a variant of `dsh-ponytail` rather than as Rein. The bigger
levers are the ones under our control: npm keywords, registry listings, and inbound links.

### Options considered

| Option | Search benefit | Cost / risk | Verdict |
|---|---|---|---|
| **A. Keep `dsh-rein`; put Ponytail in description, topics, keywords, display** | matches description/topic queries; npm keywords carry the old name | needs listing work; name-only queries still miss | **chosen** |
| B. Rename to `dsh-rein-ponytail` | enters the name-match set | redundant, longest slug, brand diluted, third identity in two days; rank gain unproven | rejected |
| C. Rename to `dsh-ponytail-rein` | enters the name-match set and the old-name set | reads as another `dsh-ponytail` fork; brand demoted to a suffix; same ranking problem | rejected |
| D. Alias repository `Chonwai/dsh-ponytail` pointing here | captures old-name searches directly | second repo to maintain; registry spam gates dislike empty duplicates; the old URL already redirects | deferred, revisit only with data |
| E. Deprecated npm alias `@chonwai/dsh-ponytail` at publish time | captures old-name npm searches | one more package; standard deprecation pattern | deferred until the first publish |

### What every surface must carry

- Display name: **Rein — Ponytail for DeepSeek Harness**.
- README first screen: says "Ponytail port for DeepSeek Harness", the old name, and links here.
- GitHub description: contains "Ponytail for DeepSeek Harness" and "Formerly dsh-ponytail".
- GitHub topics: `ponytail`, `dsh`, `deepseek-harness`, `dsh-bundle`.
- `package.json`: description mentions Ponytail; keywords include `ponytail` and `dsh-ponytail`.
  `tests/offline-check.sh` asserts all three, so a tidy-up cannot remove them silently.
- locale title, release notes, CHANGELOG, registry entry: display name, not the slug.
- Upstream attribution stays: this is a distribution, not the upstream project.

### Revisit rule

Track monthly: (1) GitHub rank for `ponytail dsh`, (2) npm search position for `ponytail deepseek
harness` after the first publish, (3) registry listing, (4) inbound links. Tracking lives in the
monthly BRANDING review; the concrete revisit date is **2027-02-09** (three months after the first
npm publish and the first registry listing, whichever lands later), earlier if either event slips. At
that point, if the default query still leaves us outside the top 20 and npm search does not show the
package on page one, revisit option B/C or D with data instead of guessing. Until the first npm
publish, another rename still costs only a reinstall.

## The naming rule for this maintainer

- npm packages: `@chonwai/dsh-<product>`; repositories `Chonwai/dsh-<product>`.
- Display names are sentence-case human phrases (`Rein — Ponytail for DeepSeek Harness`), which is
  how the official bundles present themselves; the technical name stays kebab-case.
- One-word product names in the same metaphor are allowed if they pass the availability check
  (`dsh-farrier` was screened as the fallback).
- Never name a package after the upstream project alone, and never claim "official".

## Personal branding plan

**First 30 days**

1. GitHub profile repository `Chonwai/Chonwai` (currently absent): who you are, what you ship, the
   bundle, the verification protocol, the releases. Pin `dsh-rein`.
2. Submit the bundle to the community registry `dshworks/awesome-dsh-plugins`. On 2026-11-09 it
   listed no entry from this maintainer, but it already carries 14 entries whose repositories use
   the `dsh-ponytail*` names — the differentiation is the four-level verification protocol, not
   name scarcity. One PR against `data/plugins.json`, with the entry below.

Its spam gate asks for a real install path, a non-template history and an honest `verifiedAgainst`;
all three are true here.

### Registry entry (copy-paste)

```json
{
  "name": "Rein — Ponytail for DeepSeek Harness",
  "repo": "Chonwai/dsh-rein",
  "description": "Ponytail lazy senior dev mode as a DSH bundle: six skills, scoped always-on rules and a composer pill, with a four-level verification protocol.",
  "category": "bundle",
  "tags": ["capabilities"],
  "added": "2026-11-09",
  "lastVerified": "2026-11-09",
  "verifiedAgainst": "0.2.2-rc.1",
  "status": "verified",
  "evidence": "package.json#dsh.bundle"
}
```
3. Record a short demo: Plugins card → `/ponytail` loads → a smaller diff in one task.
4. Release notes carry evidence, not adjectives.

**90 days**

- Remove `private`, publish with `npm publish --access public`, add npm version and download badges.
- Write one technical post about verifying an agent-mode plugin instead of trusting the prompt,
  using the A/B kit's numbers and naming the small sample size.
- Follow DSH releases and the registry monthly; participate through issues.

**365 days**

- Grow a family under the same scope and the same verification badge.
- Keep one "verified by" page as the source of truth instead of repeating claims per README.
- Never republish upstream benchmark numbers as ours; keep the independent-port line in releases.

## Migration performed on 2026-11-09

- `package.json` (name, version 2.0.0, description, keywords, repository/homepage/bugs),
  `cordis.patch.yml` (row id `rein`), host half (`name`, `version`, `rein-rules`), locale titles,
  tests, README/INSTALL/docs.
- GitHub repository renamed to `Chonwai/dsh-rein` (old URL redirects); the local checkout moved to
  `.../dsh-rein`.
- Profile: the old bundle was removed and the new one installed and verified (six skills load, card
  visible after a reload, pill registered).
- Upgrading users: remove `@chonwai/dsh-ponytail`, then install this package (INSTALL.md §5).

## Boundaries and fallbacks

- MIT covers the code, not the upstream name or an endorsement: keep "independent, unofficial port"
  visible in the README and NOTICE.
- Availability is not a trademark search. If this ever becomes commercial, take proper advice.
- If the name is contested, fall back to `dsh-farrier` (also free on 2026-11-09) or to a display-only
  brand; the cost is one more migration and the six skills never change.
