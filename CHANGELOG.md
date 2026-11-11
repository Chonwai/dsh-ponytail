# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-11-11

### Fixed

- **Layer-first skill resolution.** The docs and the host-half comment claimed that runtime
  registrations outrank file roots (250 vs 400/500) and that the host half skips same-name files
  with a warning instead of silently shadowing them. That is false on the standard Web preset:
  `skill-filesystem` is mounted inside the agent preset's scope while the host filesystem row is
  disabled, and the **nearest layer wins a duplicate name outright** — ranks only order duplicates
  inside one layer. Any `ponytail*` copy under `$DSH_HOME/skills`, `~/.agents/skills` or a project
  `.agents/skills` therefore wins over this bundle's global runtime registrations. The plugin's
  `skills.list({})` read is unscoped (global layer only), so it cannot see scoped file copies and
  cannot warn about them; the skip branch is best-effort for another **global** provider. Corrected
  in `lib/index.js` (comment only), README/README.zh-TW, `INSTALL.md` (including the two impossible
  troubleshooting rows), and `docs/ARCHITECTURE.md`; a migration preflight was added. No runtime
  behavior changed.
- Stale gate counts: `docs/VERIFICATION.md` now says 84 checks (was 81) and
  `docs/RELEASE.md` says 40 consumer checks (was 38).
- `SECURITY.md` supported versions now list 2.0.x and mark 1.0.x unsupported.

### Added

- `tools/check-release.sh` and the `release:check` script: version mirrors (package/lib/tests/
  checksums), checksum verification, tag==HEAD and a clean tree when run in git (SKIP from an
  extracted tarball), and npm-pack completeness. CI runs it on `v*` tags.
- `tests/` and `tools/` ship in the npm tarball so `release:check` also runs from an extracted
  package; the consumer smoke reflects that.
- README "Related bundles" links `dsh-uupm` and `dsh-gsap-skills`.

### Notes

- v2.0.1 aligns the tag with `main` after 15 post-v2.0.0 commits. No host/client behavior, vendored
  skill, or rules text changed.

## [2.0.0] - 2026-11-09

### Changed (breaking)

- **Renamed the project to Rein.** The npm package is now `@chonwai/dsh-rein` and the repository
  `Chonwai/dsh-rein`; the bundle row id is `rein` and the prompt section `rein-rules`. The reason is
  recorded in `docs/BRANDING.md`: 19 exact-name repositories and two npm packages already use the
  `dsh-ponytail` / `ponytail-dsh` names, so the old slug could not become an identity.
- The six skills, the `/ponytail*` user gestures, the pill text and the upstream attribution are
  unchanged: this is a distribution, and the mode keeps its name.
- Upgrading: remove the old `@chonwai/dsh-ponytail` bundle, then install this package (INSTALL.md §5).
  A linked local install cannot be renamed in place.

### Added

- `docs/VERIFICATION.md` (four-level verification protocol; L3 A/B with a pre-registered rule) and
  `bench/` (six tasks, score sheet, fairness rules).
- `docs/BRANDING.md` (naming decision, personal-branding plan, registry entry, fallbacks).

## [1.0.1] - 2026-11-08

### Fixed

- **Skills were listed but could not be loaded.** `skills.register()` accepts a
  definition without `source`, but the load path (`skills.get()` →
  `validateDefinition`) rejects it, so `skill("ponytail")` and the `/ponytail`
  gesture threw `loaded skill "..." source must be a string`. The host half now
  passes `source: "bundled"`.
- `tests/host-smoke.mjs` asserts the registration payload against the load-path
  contract (`source` as a non-empty string), so the regression cannot pass CI
  silently again.

### Changed

- `engines.dsh` narrowed to the tested window: `>=0.2.2-rc.1 <0.3.0`.
- `private: true` — installable from a local path, but not publishable to npm
  until a deliberate release.
- Docs: real always-on payload (3,998 B `rules.md`), load verification recorded,
  migration note corrected.

## [1.0.0] - 2026-11-08

### Added

- DeepSeek Harness bundle (`dsh.bundle.patch`) that inserts one `ponytail` row.
- Host half: registers the six vendored Ponytail skills as runtime skills
  (`ctx.skills.register`), skipping names another source already provides, and
  contributes `rules.md` as a scoped always-on system-prompt section
  (`ctx.systemPrompt.section`, order 700, suppressed by `defaultMode: off`).
- Client half: a non-interactive "Ponytail" status pill in
  `conversation.composer.dock` (id `ponytail`, order 2), themed with `--dsw-*`
  tokens and requiring no client package imports.
- Locales: `en`, `zh` (plugin-page title/description/detail).
- Original `icon.svg`.
- Offline test suite: `tests/offline-check.sh`, `tests/host-smoke.mjs`,
  `tests/client-smoke.mjs`, with sha256 pins in `checksums.txt`.
- Open-source repository files: README (en + zh-TW), INSTALL, CONTRIBUTING,
  SECURITY, NOTICE, CI workflow.

### Notes

- No runtime dependencies; no build step.
- Targeted at DSH `>=0.2.2-alpha.3 <0.3.0` (developed against 0.2.2-rc.1).
  Host and client behavior is verified offline; live activation and the
  rendered pill remain to be verified in a real profile (see INSTALL.md).
