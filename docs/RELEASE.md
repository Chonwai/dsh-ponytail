# Release runbook (first npm publish and listings)

This is the ordered path from "works on my machine" to "a stranger installs it and nothing surprises
them". Each step names the gate that must be green before moving on. Nothing here claims the tool
makes code smaller; that is the A/B gate in `docs/VERIFICATION.md`, and no result has been published
yet.

## Preconditions

1. `npm test` → `RESULT: PASS (84 checks)`.
2. `npm run test:consumer` → `RESULT: PASS (40 checks)` (the tarball a stranger downloads).
3. CI green on `main` for the commit you are about to tag.
4. `docs/VERIFICATION.md` L1 and L2 re-run on this machine after the last code change.
5. The install/upgrade path in `INSTALL.md` matches the version you are publishing.
6. `npm run release:check` passes on the tagged commit (CI also runs it for `v*`
   tags; from an extracted tarball it SKIPs the git-only tag/clean-tree checks).

## Publish to npm

1. Remove `"private": true` from `package.json` in its own commit
   (`chore: make the package publishable`). Nothing else changes.
2. `npm login` with the account that owns the `@chonwai` scope, then
   `npm publish --access public`. Use `--provenance` when publishing from CI so the tarball is tied
   to this repository and commit.
3. Verify from outside the repository:
   - `npm view @chonwai/dsh-rein version` returns the version you published;
   - in a throwaway directory, `npm pack @chonwai/dsh-rein` and run the consumer checks against the
     downloaded tarball;
   - install it by spec (`plugin_manager install_bundle`, target `@chonwai/dsh-rein@<version>`) in a
     canary profile and repeat L2 (six skills load, row active, pill registered).
4. Only after the npm install works, update `INSTALL.md` to show the npm spec first and the local
   checkout second, and add the npm badges to the README.

### If the publish is wrong

npm cannot rename a package. Prefer `npm deprecate @chonwai/dsh-rein@<bad> "<reason>; use <good>"`
and publish a patch; `npm unpublish` only inside npm's policy window (72 hours) and only for a
security or data-loss reason, because it breaks every consumer who already installed the version.
The tagged source is not invalidated by a bad publish: fix on `main`, cut a patch, and say what
happened in the release notes.

Optional, at publish time: create a deprecated alias package `@chonwai/dsh-ponytail` whose README says
"renamed to @chonwai/dsh-rein" and whose install instructions point at Rein, then `npm deprecate` it
with the same message. It captures old-name searches; it is not required for a working release.

## Registry and lists

1. `dshworks/awesome-dsh-plugins`: fork, add the entry already prepared in `docs/BRANDING.md` to
   `data/plugins.json`, run `node scripts/validate.mjs && node scripts/render.mjs`, open the PR. The
   registry already lists 14 `dsh-ponytail*` entries; the entry's differentiation is the verification
   protocol, not the name.
2. Other DSH lists (search `awesome-deepseek-harness`): submit the same one-line description; do not
   keyword-stuff.
3. Do not submit until the package installs from the spec you claim in the entry's `verifiedAgainst`.

## Presentation

- A 10–20 second demo: Plugins card, `/ponytail` loading, one small diff. Keep the file in `assets/`
  and link it from the README.
- One technical post about the verification protocol and the 1.0.1 load-path bug; publish the pilot
  as a pilot, not as a result.
- Release notes carry evidence (gates, live checks), not adjectives.

## After the first release

- Watch install reports through the issue template; label regressions.
- Re-run `npm test`, `npm run test:consumer`, L1/L2 on the published spec after any dependency or DSH
  change.
- Track discovery monthly (see `docs/BRANDING.md` → revisit rule, 2027-02-09).
- Never move a released tag; cut a new patch version instead. If the docs were wrong, put the fix on
  `main` and note it in the release notes (as done for v2.0.0).

## Definition of done for the first publish

- A stranger can install from npm by spec, see six skills load, see the card in Plugins, and remove
  the bundle cleanly.
- The registry entry is merged or the PR is open with the maintainer's review.
- `INSTALL.md` shows the npm path first and the local checkout as the fallback.
- No page claims an effect that the A/B gate has not measured.
