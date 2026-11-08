# Naming and branding

Decision recorded 2026-11-09. Availability checks were run on that date with `npm view` and
`gh search repos`; they say what was visible then, not what can be trademarked.

## The decision

| Thing | Name | Change now? |
|---|---|---|
| npm package | `@chonwai/dsh-ponytail` | **No** — the scoped name is the ownable asset |
| GitHub repository | `Chonwai/dsh-ponytail` | **No** — already linked from the release and registry drafts |
| Display name | **Ponytail for DeepSeek Harness** | **Yes** — use it in the README hero, the GitHub description and registry entries |
| Maintainer brand | **Chonwai** | **Yes** — `@chonwai` scope, byline, future `@chonwai/dsh-*` family |
| Skills | `ponytail`, `ponytail-review`, … | **Never** — byte-identical upstream content; renaming breaks the pin and the docs |
| Upstream attribution | `NOTICE` + README | **Never remove** — MIT requires the notice; honesty requires the "independent" line |

One sentence used everywhere: *"Ponytail for DeepSeek Harness — a verified, reversible bundle by
Chonwai: six skills, a scoped always-on ruleset and a composer pill, MIT, no dependencies."*

## Why not a distinct product name

The category is already crowded, and the names are gone:

| Name | State on 2026-11-09 |
|---|---|
| npm `dsh-ponytail` | taken — 0.2.0, published 2026-08-15 by a different author, no repo link |
| npm `ponytail-dsh` | taken — 0.1.0, repo `52sujiu/ponytail-dsh` |
| GitHub `clawsu/ponytail-dsh`, `HosisoraLing/ponytail-dsh` | taken — other DSH ports |
| `ziduup/dsh-programming-mode` | taken — bundles Superpowers + Ponytail |
| npm `saddle` / `bridle` / `pony-express` / `farrier` / `lasso` | all taken (0.9.7 / 1.0.2 / 1.1.4 / 0.7.0 / 4.0.4) |

An invented name would lose the two search terms people actually type ("ponytail", "dsh") and would
risk implying an official relationship with the upstream project. The scoped descriptive name is the
only option that is both available and discoverable. What differentiates this port is not the name:
it is the verification protocol, the reversibility, and the honesty about what is and is not proven.

## The naming rule for this maintainer

- npm packages: `@chonwai/dsh-<capability>` — e.g. `@chonwai/dsh-ponytail`. The scope is yours; the
  `dsh-` prefix is the ecosystem's discovery convention.
- repositories: `Chonwai/dsh-<capability>`.
- display name: `<Upstream tool> for DeepSeek Harness`, never the upstream name alone and never
  "official".
- versions: plain semver, one release per behavior change; chores land on `main` without a release.

## Personal branding plan

**First 30 days**

1. Create the profile repository `Chonwai/Chonwai` with a six-line README: who you are, what you
   ship, the bundle, the verification protocol, and a link to the releases. Pin the bundle repo.
2. Set the GitHub description to the one-liner above; keep the six topics
   (`deepseek-harness`, `dsh`, `dsh-bundle`, `ponytail`, `ai-agent`, `skills`).
3. Submit the bundle to the community registry `dshworks/awesome-dsh-plugins` (it currently lists no
   Ponytail entry at all). One PR against `data/plugins.json`:

   ```json
   {
     "name": "Ponytail for DeepSeek Harness",
     "repo": "Chonwai/dsh-ponytail",
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

   The registry's spam gate wants a real install path (we have `dsh.bundle`), a non-template history
   (we have a real commit history and a test suite) and honest `verifiedAgainst`; `0.2.2-rc.1` is what was
   actually exercised.
4. Record a short demo: Plugins card → `/ponytail` loads → a smaller diff in one task. Keep it in
   `assets/` and link it from the README.
5. Release notes carry the evidence, not adjectives: version, tests, what was live-verified.

**90 days**

- Remove `private` and publish to npm (`npm publish --access public`), then add the npm version and
  download badges. Publishing makes `dsh plugin add @chonwai/dsh-ponytail` real; until then, the
  README must keep saying "local checkout".
- Write one technical post: "How I verified an agent-mode plugin instead of trusting the prompt",
  using the A/B kit's real numbers and naming the small sample size.
- Follow the registry and DSH release notes monthly; participate with issues, not drive-by comments.

**365 days**

- Grow the family: `@chonwai/dsh-<capability>` bundles that share the same verification badge and the
  same reversibility rules.
- Keep a single "verified by" page (source of truth) rather than repeating claims in every README.
- Never republish upstream benchmark numbers as yours; keep the `NOTICE` and the independent
  integration line in every release.

## Boundaries

- MIT lets you redistribute the skills; it does not grant the upstream project's name or imply
  endorsement. Keep "independent integration, not affiliated" visible.
- Availability on npm/GitHub is not a trademark clearance; if this ever matters commercially, get
  proper advice.
- If a rename is ever forced (trademark, confusion), the costs are: GitHub repo rename keeps a
  redirect; npm cannot rename, so publish the new name and deprecate the old one; a package-name
  change means removing and reinstalling the bundle in the profile, because the Loader row names the
  package. The six skills never rename.
