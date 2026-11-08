# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
