# INSTALL — @chonwai/dsh-ponytail

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
| Restart | a new bundle *can* activate through HMR, but a fresh JavaScript module generation and the client bundle are not guaranteed until a reload/restart — see §3 |
| Backout | toggle the bundle off, or remove it (§6) |

Recommended: confirm the six skills are **not** also present as files before enabling this bundle
(§5). Two sources with the same skill names make the catalog confusing even though the host half
guards against double-registration.

## 1. Install from the Web UI (recommended for a local checkout)

1. Open DSH → **Plugins** in the sidebar.
2. **Add plugin** → **Install a third-party plugin**.
3. Paste the **absolute path** to this directory, e.g. `/Users/you/code/dsh-ponytail`.
4. Read the trust box and confirm. The Host reads the package (`pluginManager.inspect`), runs pnpm
   against the profile, then applies the bundle patch.
5. If the dialog offers **Enable now**, accept it (the install normally enables a new bundle).
6. Reload the page and open a **new session**. Then verify with §4.

## 2. Install through `plugin_manager` (agent-driven)

From a session with Full access (or an approval prompt you can answer):

```
plugin_manager(action: "install_bundle", target: "/abs/path/to/dsh-ponytail")
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
dsh plugin add /abs/path/to/dsh-ponytail
```

The Desktop app's `desktop` profile is managed exclusively by the app and rejects CLI plugin
operations. Use §1 or §2 there. For a CLI-managed profile this is equivalent to §2.

## 4. Restart and verify

1. **Restart DSH** (quit and reopen, or reload the Web page if the build supports a live client
   reload). Rationale: installing a new bundle can apply through HMR, but a fresh client bundle and
   a fresh Host module generation are not guaranteed until restart/reload; the Plugins page reads
   bundles through the Host, so a reload is also how you see the new card immediately.
2. **Plugins page**: **Installed plugins** should list the bundle by package name with the manifest
   description and version, with its switch and removal available. A localized title/description and
   the `icon.svg` artwork come from `locale/*.json` when the running build surfaces localized bundle
   metadata; where it does not, the card falls back to the package name and description. Open its
   details: the long description is `meta.detail` (`README.md` / `README.zh-TW.md`) when the locale
   resolves, otherwise the README. The bundle's plugin row **ponytail** is listed too.
3. **New session catalog**: the available-skills catalog should list:
   `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`,
   `ponytail-review`. They are runtime skills (provider `runtime`).
4. **Always-on rules**: ask for a coding task; the answer should follow Ponytail's shape (smallest
   complete change, one or two closing lines about what was skipped and the risk). The Host
   provides no read-only "show me the prompt section" tool in every profile — a reliable check is
   to compare behavior with the row off vs on.
5. **Composer pill**: the composer dock should show a small non-interactive `● Ponytail` pill
   (id `ponytail`, order 2). It must not intercept typing or clicks. If it is missing, see §7.
6. **Read-only inspection** (no approval in profiles with Full access): use the Cordis Config
   inspector for the package name to find the live row and its resolved config:
   `cordis_inspect_query(platform: "host", provider: "Config", method: "listConfigs", input: { name: "@chonwai/dsh-ponytail" })`.

Optional checks:

- Toggle the bundle/row **off**, start a new session: the six skills and the rules should disappear
  (the host half releases its registrations on dispose). Toggle **on** to restore.
- Override the row config to `defaultMode: "off"` (see §7) and restart: the rules section is
  suppressed, the skills stay registered.

### Live verification record (this repo's first install)

Observed on DSH 0.2.2-rc.1, `desktop` profile, 2026-11-08, macOS:

| Check | Observed |
|---|---|
| `plugin_manager install_bundle` result | `application: "applied"`, `enabled: true`, `version: "1.0.0"`, no warnings |
| profile state | dependency `link:<repo>`, bundle appended to `dsh.profile.bundles`, Loader row `include:ponytail` with the package directory resolved |
| session skill catalog | the six `ponytail*` names appear in the next catalog |
| always-on rules | `rules.md` (scope note + upstream text) appears as one system-prompt section |
| client dock | `conversation.composer.dock` has occupant `ponytail`, order 2, active |
| Plugins listing | `pluginManager.listBundles()` returns the bundle as installed, enabled, removable |
| Plugins page visual | the page reads that listing at load, so it needs a reload after install; the card itself was not screenshot-verified in this round |

## 5. Migrating from the file-level install

The file-level route copies the same six skill names into `$DSH_HOME/skills` (skill rank 400) or
`~/.agents/skills` (rank 500), and optionally adds a block into a repository's `AGENTS.md`.
Runtime registrations from this bundle rank higher (250), so the two sources would compete for the
same names. The host half skips names that are already provided and logs a warning; that is a
guard, not a migration.

Checklist, in order:

- [ ] 1. Decide who owns the always-on rules.
      **Bundle** = global system-prompt section for every session in the profile.
      **`AGENTS.md` block** = per repository only.
      Keep one; two copies duplicate roughly 2.7 KB of prompt text per request.
- [ ] 2. Remove the file-level skills: move the six `ponytail*` directories out of the skill roots
      instead of deleting them blindly (and back them up first if you edited them):
      ```bash
      ls ~/.dsh/skills ~/.agents/skills 2>/dev/null | grep '^ponytail'
      ```
      If a repository `AGENTS.md` also carries a Ponytail block, delete that block by hand.
- [ ] 3. Confirm the clean state: a new session's catalog no longer lists `ponytail*`, and
      `~/.dsh/skills` / `~/.agents/skills` no longer contain the six directories.
- [ ] 4. If you installed the bundle **before** step 2, its duplicate detection skipped the six
      names. Toggle the bundle (or the `ponytail` row) **off → on**, or restart DSH, so registration
      runs again against the clean catalog.
- [ ] 5. Verify with §4.
- [ ] 6. To go back: remove the bundle (§6), then copy the six `SKILL.md` files back into
      `$DSH_HOME/skills` from the upstream release.

## 6. Rollback

| Intent | Action | Notes |
|---|---|---|
| Pause without uninstalling | Plugins → switch the bundle off (or `plugin_manager set_bundle enabled:false`) | keeps the package installed; the bundle layer stops applying |
| Remove completely | Plugins → Remove (or `plugin_manager remove_bundle`) | removes the dependency and layer; restart if asked |
| Return to file-level install | remove the bundle, then run the file-level installer | file-level route is unaffected by this package |
| Undo only the rules | no config UI in v1; set `defaultMode: "off"` in the row override (§7) or remove the bundle | skills stay registered when `off` |

Removing the bundle does not reinstall file-level skills. Pick one strategy.

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Plugins page shows the bundle with an **error** | package not readable, bundle patch invalid, or an engine mismatch | check the startup diagnostics; confirm `node --check lib/*.js` and that `engines.dsh` accepts your DSH version; reinstall |
| Bundle enabled but the row is **inactive/failed** | a host-side exception or a missing optional service. Missing `skills`/`systemPrompt` alone only warns, but a module import error fails the row | read the startup warnings; if you changed code, reinstall; a replaced package needs a restart for a fresh module generation |
| No `ponytail*` in a new session's catalog, but Plugins shows the bundle | the six names were already provided when the plugin mounted (file-level install still present), so registration was skipped | remove the file-level skills, then toggle the row off/on (§5) |
| Catalog has duplicates of `ponytail*` (two providers) | file-level and runtime copies both present | remove the file-level install; runtime wins but the catalog is confusing |
| No pill in the composer dock | the client module did not load, or the Web client was not reloaded/rebuilt after install | confirm `dsh.client` in the installed package, restart/reload DSH, and check the browser console for module-load errors |
| Pill overlaps the composer or captures clicks | it must be `pointer-events: none` and live inside the slot's flow | report with a screenshot; do not patch host DOM |
| Rules not applied | `defaultMode` is `off`, or the `systemPrompt` service is absent in this composition (warning in logs) | remove the `off` override / use a preset that mounts `systemPrompt` |
| Want a specific level (`lite`/`ultra`) | v1 has no level state machine | state the level in your prompt; the skill body explains the levels |

### Override the level (row config)

v1 exports no `Config` schema, so there is no settings UI. To set `off`, override the row from the
profile's `cordis.patch.yml` (or the equivalent patch layer) and restart:

```yaml
- id: ponytail
  name: '@chonwai/dsh-ponytail'
  config:
    defaultMode: 'off'
```

The host half reads `config.defaultMode` defensively; `off` only suppresses the rules section.

## 8. Filing an issue

Include: DSH version (`DSH` app version / `dsh --version`), profile name, the plugin row's activation
state, relevant startup diagnostics and browser console output, whether the file-level install was
present, and a screenshot for anything visual. See `SECURITY.md` for security reports.
