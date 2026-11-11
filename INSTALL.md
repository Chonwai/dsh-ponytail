# INSTALL — @chonwai/dsh-rein

DeepSeek Harness (DSH) bundle installation, migration from the file-level install, verification,
rollback and troubleshooting. Written for DSH **0.2.2-rc.1** on macOS; the same flow applies to any
managed profile.

> The bundle ships two halves: a Host plugin (skills + always-on rules) and a Web client decoration
> (the composer-dock pill). Both come from this one package; you install the package once.

## 0. Before you install

| Item | Detail |
|---|---|
| What gets written | the profile's `package.json` dependency (`link:` for a local directory), the ordered `dsh.profile.bundles` list, the profile `node_modules` copy/link, and the profile lockfile — all done by DSH's Plugin Manager, not by this package |
| What this package writes at runtime | nothing outside its own package; it only reads `skills/*/SKILL.md` and `rules.md` |
| Approval needed | every `plugin_manager` action (including listing) needs **Full access** or an approval prompt; the Web UI install dialog has its own trust confirmation |
| Network | none for a local-directory install; no dependencies to download |
| Restart | a new bundle *can* activate through HMR, but a fresh JavaScript module generation and the client bundle are not guaranteed until a reload/restart — see §4 |
| Backout | toggle the bundle off, or remove it (§7) |

Recommended: confirm the six skills are **not** also present as files before enabling this bundle
(§6). File-level copies are discovered in the agent scope by the standard preset and win over this
bundle's global runtime registrations, so the bundle's skills would be inert for the session.

## 1. Install from the Web UI (recommended for a local checkout)

1. Open DSH → **Plugins** in the sidebar.
2. **Add plugin** → **Install a third-party plugin**.
3. Paste the **absolute path** to this directory, e.g. `/Users/you/code/dsh-rein`.
4. Read the trust box and confirm. The Host reads the package (`pluginManager.inspect`), runs pnpm
   against the profile, then applies the bundle patch.
5. If the dialog offers **Enable now**, accept it (the install normally enables a new bundle).
6. Reload the page and open a **new session**. Then verify with §4.

## 2. Install through `plugin_manager` (agent-driven)

From a session with Full access (or an approval prompt you can answer):

```
plugin_manager(action: "install_bundle", target: "/abs/path/to/dsh-rein")
```

- The tool runs the same `installBundle` operation as the UI: `pnpm add link:<path>`, append to
  `dsh.profile.bundles`, apply `dsh.bundle.patch`, and enable the bundle by default.
- This package has no dependencies and no install scripts, so no `approvedBuilds` /
  `pendingBuilds` prompt appears.
- Read the returned `application` field: `applied` means the configuration layer was applied;
  `restart-required` means restart DSH before testing.

Do **not** reproduce the install by editing the profile's `package.json` or `cordis.patch.yml` by
hand and running pnpm yourself — that is outside the supported Plugin Manager flow and needs a
separate approval per write.

## 3. CLI (CLI-managed profiles only)

```bash
dsh plugin add /abs/path/to/dsh-rein
```

The Desktop app's `desktop` profile is managed exclusively by the app and rejects CLI plugin
operations. Use §1 or §2 there. For a CLI-managed profile this is equivalent to §2.

## 4. Restart and verify

The short version is below; the full four-level protocol (package contract, installation reality,
live behavior, A/B benchmark) is in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

1. **Restart DSH** (quit and reopen, or reload the Web page if the build supports a live client
   reload). Rationale: installing a new bundle can apply through HMR, but a fresh client bundle and
   a fresh Host module generation are not guaranteed until restart/reload; the Plugins page reads
   bundles through the Host, so a reload is also how you see the new card immediately.
2. **Plugins page**: **Installed plugins** should list the bundle by package name with the manifest
   description and version, with its switch and removal available. A localized title/description and
   the `icon.svg` artwork come from `locale/*.json` when the running build surfaces localized bundle
   metadata; where it does not, the card falls back to the package name and description. Open its
   details: the long description is `meta.detail` (`README.md` / `README.zh-TW.md`) when the locale
   resolves, otherwise the README. The bundle's plugin row **rein** is listed too.
3. **New session catalog**: the available-skills catalog should list:
   `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`,
   `ponytail-review`. They are runtime skills (provider `runtime`).
4. **Always-on rules**: ask for a coding task; the answer should follow Ponytail's shape (smallest
   complete change, one or two closing lines about what was skipped and the risk). The Host
   provides no read-only "show me the prompt section" tool in every profile — a reliable check is
   to compare behavior with the row off vs on.
5. **Composer pill**: the composer dock should show a small non-interactive `● Ponytail` pill
   (id `ponytail`, order 2). It must not intercept typing or clicks. If it is missing, see §8.
6. **Read-only inspection** (no approval in profiles with Full access): use the Cordis Config
   inspector for the package name to find the live row and its resolved config:
   `cordis_inspect_query(platform: "host", provider: "Config", method: "listConfigs", input: { name: "@chonwai/dsh-rein" })`.

Optional checks:

- Toggle the bundle/row **off**, start a new session: the six skills and the rules should disappear
  (the host half releases its registrations on dispose). Toggle **on** to restore.
- Override the row config to `defaultMode: "off"` (see §8) and restart: the rules section is
  suppressed, the skills stay registered.

### Live verification record (this repo's first install)

Observed on DSH 0.2.2-rc.1, `desktop` profile, 2026-11-08, macOS:

| Check | Observed |
|---|---|
| `plugin_manager install_bundle` result | `application: "applied"`, `enabled: true`, `version: "1.0.0"`, no warnings |
| profile state | dependency `link:<repo>`, bundle appended to `dsh.profile.bundles`, Loader row `include:rein` with the package directory resolved |
| session skill catalog | the six `ponytail*` names appear in the next catalog |
| always-on rules | `rules.md` (scope note + upstream text) appears as one system-prompt section |
| client dock | `conversation.composer.dock` has occupant `ponytail`, order 2, active |
| Plugins listing | `pluginManager.listBundles()` returns the bundle as installed, enabled, removable |
| Plugins page visual | after a reload the Ponytail card is visible in the desktop Web UI (2026-11-08) |
| skill load (1.0.0) | `skill("ponytail")` threw `loaded skill "ponytail" source must be a string`; fixed in 1.0.1 |
| skill load (1.0.1, after bundle off/on) | all six `skill("…")` calls return `<skill_content>` (provider `runtime`); an independent verifier loaded each and matched two bodies against the vendored files |
| module reload | toggling the bundle off/on unloads and remounts the host plugin, so a changed linked module is picked up without an app restart |
| install (2.0.0 rename) | remove of `@chonwai/dsh-ponytail`, then install of `@chonwai/dsh-rein` → `application: "applied"`, `version: "2.0.0"` |
| row and slot after rename | Loader row `include:rein`; `skill("ponytail")` returns `<skill_content>`; composer occupant `ponytail` (order 2) still active |

## 5. Upgrading from 1.x (`@chonwai/dsh-ponytail`)

Version 2.0.0 renamed the package to `@chonwai/dsh-rein`; the skills, gestures and pill text did not
change. A `link:` install cannot be renamed in place, so:

1. Plugins page → remove the `@chonwai/dsh-ponytail` bundle (or
   `plugin_manager(action: "remove_bundle", target: "@chonwai/dsh-ponytail")`).
2. Install this package from the renamed checkout path, as in §1 or §2.
3. Confirm the profile depends on `@chonwai/dsh-rein`, the row is `rein`, and the checks in §4 pass.
4. A `node_modules/@chonwai/dsh-ponytail` symlink left behind is dangling: `pnpm install` in the
   profile or a DSH restart prunes it, or delete it by hand.

The previous release `v1.0.1` stays available for anyone who still needs the old package name.

## 6. Migrating from the file-level install

DSH resolves skills **layer-first**: the standard Web preset mounts `skill-filesystem` inside the
agent preset's scope and disables the host filesystem row, so the **nearest layer wins a duplicate
name outright**. The file-level route copies the six names into `$DSH_HOME/skills` or
`~/.agents/skills` (and optionally a project `.agents/skills`), where the preset's provider
discovers them in the agent scope; those copies therefore take precedence over this bundle's global
runtime registrations, regardless of the 250/400/500 ranks (which only order duplicates inside one
layer). Remove them **before** enabling the bundle.

Preflight:

```bash
test -d ~/.agents/skills/ponytail && echo "file copy wins"
test -d "${DSH_HOME:-$HOME/.dsh}/skills/ponytail" && echo "file copy wins"
```

The host half's `skills.list({})` read is unscoped and best-effort: it can detect another
**global** provider (for example a host-enabled filesystem row) and then skip with a warning, but it
cannot see per-agent scoped discovery. It will not warn about scoped file copies; the migration
below is the real guard.

Checklist, in order:

- [ ] 1. Decide who owns the always-on rules.
      **Bundle** = global system-prompt section for every session in the profile.
      **`AGENTS.md` block** = per repository only.
      Keep one: the upstream `AGENTS.md` block is 2,721 B and this bundle's `rules.md` is
      3,998 B, so two copies cost both on every request.
- [ ] 2. Remove the file-level skills: move the six `ponytail*` directories out of the skill roots
      instead of deleting them blindly (and back them up first if you edited them):
      ```bash
      ls ~/.dsh/skills ~/.agents/skills 2>/dev/null | grep '^ponytail'
      ```
      If a repository `AGENTS.md` also carries a Ponytail block, delete that block by hand.
- [ ] 3. Confirm the clean state: a new session's catalog no longer lists `ponytail*`, and
      `~/.dsh/skills` / `~/.agents/skills` no longer contain the six directories.
- [ ] 4. If the bundle was enabled while a **host-level (global)** filesystem provider owned the
      names, its duplicate detection skipped them: toggle the bundle (or the `ponytail` row)
      **off → on**, or restart DSH, after removing. Under the standard Web preset the scoped copies
      are invisible to that read, so the bundle registered globally; removing them makes it the
      winning entry at the next pre-step (a toggle is not required, but it is harmless).
- [ ] 5. Verify with §4.
- [ ] 6. To go back: remove the bundle (§7), then copy the six `SKILL.md` files back into
      `$DSH_HOME/skills` from the upstream release.

## 7. Rollback

| Intent | Action | Notes |
|---|---|---|
| Pause without uninstalling | Plugins → switch the bundle off (or `plugin_manager set_bundle enabled:false`) | keeps the package installed; the bundle layer stops applying |
| Remove completely | Plugins → Remove (or `plugin_manager remove_bundle`) | removes the dependency and layer; restart if asked |
| Return to file-level install | remove the bundle, then run the file-level installer | file-level route is unaffected by this package |
| Undo only the rules | no config UI in v1; set `defaultMode: "off"` in the row override (§8) or remove the bundle | skills stay registered when `off` |

Removing the bundle does not reinstall file-level skills. Pick one strategy.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Plugins page shows the bundle with an **error** | package not readable, bundle patch invalid, or an engine mismatch | check the startup diagnostics; confirm `node --check lib/*.js` and that `engines.dsh` accepts your DSH version; reinstall |
| Bundle enabled but the row is **inactive/failed** | a host-side exception or a missing optional service. Missing `skills`/`systemPrompt` alone only warns, but a module import error fails the row | read the startup warnings; if you changed code, reinstall; a replaced package needs a restart for a fresh module generation |
| A `ponytail*` skill body is an old or edited file copy, not the bundle's v5.3.3 text | file-level copies are discovered in the agent's scope and win layer-first; the bundle's unscoped catalog read cannot warn about scoped copies | run the §6 preflight and move the file copies out; the bundle becomes the winning entry at the next pre-step |
| No `ponytail*` in a new session's catalog after removing the file copies | the row was toggled, a host-level provider caused the skip path, or the session predates registration | toggle the row off/on or restart DSH, then check §4 |
| `skill(...)` fails with `source must be a string` after you updated files | the Host still runs the module generation imported earlier | toggle the bundle off/on in **Plugins** (or restart DSH), then verify §4 |
| No pill in the composer dock | the client module did not load, or the Web client was not reloaded/rebuilt after install | confirm `dsh.client` in the installed package, restart/reload DSH, and check the browser console for module-load errors |
| Pill overlaps the composer or captures clicks | it must be `pointer-events: none` and live inside the slot's flow | report with a screenshot; do not patch host DOM |
| Rules not applied | `defaultMode` is `off`, or the `systemPrompt` service is absent in this composition (warning in logs) | remove the `off` override / use a preset that mounts `systemPrompt` |
| Want a specific level (`lite`/`ultra`) | v1 has no level state machine | state the level in your prompt; the skill body explains the levels |

### Override the level (row config)

v1 exports no `Config` schema, so there is no settings UI. To set `off`, override the row from the
profile's `cordis.patch.yml` (or the equivalent patch layer) and restart:

```yaml
- id: rein
  name: '@chonwai/dsh-rein'
  config:
    defaultMode: 'off'
```

The host half reads `config.defaultMode` defensively; `off` only suppresses the rules section.

## 9. Filing an issue

Include: DSH version (`DSH` app version / `dsh --version`), profile name, the plugin row's activation
state, relevant startup diagnostics and browser console output, whether the file-level install was
present, and a screenshot for anything visual. See `SECURITY.md` for security reports.
