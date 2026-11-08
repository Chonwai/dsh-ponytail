# @chonwai/dsh-ponytail

[![CI](https://github.com/Chonwai/dsh-ponytail/actions/workflows/ci.yml/badge.svg)](https://github.com/Chonwai/dsh-ponytail/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Ponytail as a DeepSeek Harness bundle.** Six skills, one scoped always-on ruleset, and a small
"Ponytail" pill in the composer dock — installable from the Plugins page, removable from the same
place.

Ponytail (upstream: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)) is a
"lazy senior dev" instruction set: solve the whole problem with the smallest change, do not build
what nobody asked for, and never cut validation, error handling, security or accessibility. This
bundle packages the upstream v5.3.3 skills and rules for DeepSeek Harness (DSH).

## Why a bundle instead of loose files

| | Copying `SKILL.md` files into `~/.dsh/skills` | This bundle |
|---|---|---|
| Shows up in **Plugins** | No | **Yes** — installed-bundle card with description, version, toggle/remove, README details |
| On/off and removal | Manual file deletion | Plugin-page toggle / remove |
| Always-on rules | A repository `AGENTS.md` block | Global system-prompt section from `rules.md` |
| Versioning | You track checksums yourself | Package version + `checksums.txt` pins |
| Scope of rules | Per repository | Every session in the profile |

If you only want the skills and per-repository rules, the file-level install remains simpler. This
bundle is for people who want the plugin lifecycle, the Plugins page presence, and the pill.

## What it provides

- **Six skills** registered as runtime skills, vendored byte-identically from Ponytail v5.3.3:
  `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`,
  `ponytail-help`.
- **Scoped always-on rules** injected as one system-prompt section (order 700) from `rules.md`:
  Ponytail's rules apply to **code changes only**; research, documents, reviews and analysis must
  stay complete. `config.defaultMode: off` suppresses the rules while keeping the skills.
- **A non-interactive "Ponytail" status pill** in `conversation.composer.dock` (id `ponytail`,
  order 2), themed with `--dsw-*` tokens, `pointer-events: none`.
- **Plugin-page metadata**: `locale/en.json` and `locale/zh.json` titles/descriptions/details and
  an original `icon.svg`. The installed-bundle card always carries the package name, description
  and version; whether a running DSH build surfaces the localized title and icon depends on its
  bundle-metadata reader.
- **No runtime dependencies, no build step, no telemetry.** The host half only reads its own
  package files.

## Requirements

- DeepSeek Harness **0.2.2-rc.1** (declared `engines.dsh: ">=0.2.2-alpha.3 <0.3.0"`).
- Node.js `^22.19.0 || >=24.0.0` (inherited from the Harness).
- A DSH **profile with a managed profile directory** (the Desktop app or a CLI-managed profile).
  The Desktop app's `desktop` profile is managed exclusively by the app: install through the
  Web **Plugins** page or the `plugin_manager` tool, not `dsh plugin add` from a terminal.

## Install

Three ways, in order of convenience:

### 1. Plugins page (recommended for a local checkout)

1. Open DSH → **Plugins** → **Add plugin**.
2. Choose **Install a third-party plugin** and paste the absolute path of this directory,
   e.g. `/Users/you/code/dsh-ponytail`.
3. Confirm the trust prompt and **Install**, then **Enable now** if asked.
4. Reload / reopen a session. See [`INSTALL.md`](INSTALL.md) for verification and troubleshooting.

### 2. `plugin_manager` (agent-driven, needs Full access)

```
plugin_manager(action: "install_bundle", target: "/abs/path/to/dsh-ponytail")
```

The tool runs pnpm against the profile — every `plugin_manager` action needs Full access or
approval. This package has no dependencies and no install scripts, so no build approval appears.

### 3. CLI (CLI-managed profiles only)

```bash
dsh plugin add /abs/path/to/dsh-ponytail
```

The Desktop app's `desktop` profile rejects CLI plugin operations; use way 1 or 2 there.

A future release will be publishable as `@chonwai/dsh-ponytail`; then `dsh plugin add
@chonwai/dsh-ponytail` (or the Plugins page's search field) will work without a local checkout.

## Usage

After installing and starting a new session:

- `/ponytail` — load the core Ponytail skill (also triggered by natural language such as
  "use ponytail", "be lazy", "simplest solution", "YAGNI").
- `/ponytail-review` — review a change like the senior dev who gets paged when it breaks.
- `/ponytail-audit` — whole-repository audit report.
- `/ponytail-debt` — list every `shortcut:` comment as a debt ledger.
- `/ponytail-gain`, `/ponytail-help` — scoreboard and quick reference.
- The scoped rules are already in the system prompt, so coding tasks start in Ponytail mode
  without loading anything.

Examples (a skill loads for the step that needs it; the scoped rules are the only always-on part):

- `Use ponytail for this fix; keep the diff small` — smallest complete change.
- `/ponytail-review` after a diff — review like the senior dev who gets paged when it breaks.
- `Audit this repo with ponytail-audit and rank what can actually break` — report only, no edits.
- `ponytail ultra, challenge the requirements` — blunt level.
- `ponytail debt` — every `shortcut:` comment as a debt ledger.

**v1 limitation:** there is no level state machine (`lite`/`full`/`ultra` switching) and no
`/ponytail off` command. The level table lives in the skill body; tell the model which level you
want, or override `config.defaultMode` to `off` at the profile level (see `INSTALL.md`) to
suppress the always-on rules.

## Migrating from a file-level install

If the six skills are already installed as files under `$DSH_HOME/skills` or `~/.agents/skills`,
remove them **before** enabling this bundle:

1. Run the file-level uninstaller (or delete the six skill directories from `~/.dsh/skills` and
   `~/.agents/skills`).
2. If a repository carries a Ponytail block in `AGENTS.md` and you want the bundle to own the
   always-on rules, strip that block too.
3. Toggle the bundle row off/on (or restart DSH) so duplicate detection re-runs on the clean
   catalog.

The host half detects same-name skills and skips them with a warning rather than silently shadowing
the file-level copies. Full checklist: [`INSTALL.md`](INSTALL.md#migrating-from-the-file-level-install).

## Security and privacy

- No runtime dependencies, no install scripts, no build step.
- The host half reads `skills/*/SKILL.md` and `rules.md` from its own package; nothing else. No
  subprocesses, no sockets, no writes, no telemetry.
- The client half is a static React decoration; no `fetch`, no DOM outside its own element tree.
- `checksums.txt` pins every vendored file; `tests/offline-check.sh` verifies the pins in CI.
- Review `rules.md` before enabling: it becomes part of the system prompt for every session in the
  profile.

See [`SECURITY.md`](SECURITY.md) for reporting.

## Compatibility and status

Designed for DSH 0.2.2-rc.1. Verified:

- Offline: package structure, manifest, locale, icon and bundle patch parse; skills match upstream
  v5.3.3 byte-for-byte; `node --check` passes; host and client smoke tests pass.
- Live (desktop profile, 0.2.2-rc.1): `plugin_manager install_bundle` returned
  `application: "applied"`; the bundle is listed as installed/enabled/removable; the six skills
  appear in the session catalog; `rules.md` appears as one system-prompt section; the client
  registers the `ponytail` occupant (order 2) in `conversation.composer.dock`.
- Plugins page: after a reload the Ponytail card is visible in the desktop Web UI (confirmed on the
  same 0.2.2-rc.1 desktop profile). Not screenshot-verified: the pill's pixels — its slot occupant
  is live, but the drawing itself was not captured. Details and troubleshooting in `INSTALL.md`.

## Development

```bash
node --check lib/index.js && node --check lib/client.js
node tests/host-smoke.mjs
node tests/client-smoke.mjs
bash tests/offline-check.sh      # acceptance gate, prints RESULT: PASS
```

No install step: the repository *is* the package. See [`CONTRIBUTING.md`](CONTRIBUTING.md) before
changing vendored files.

## Rollback

- **Plugins** page → switch the bundle off (keeps the package installed), or remove it.
- Agent/automation: `plugin_manager(action: "set_bundle", ...)` / `remove_bundle`.
- After removal, re-install the file-level skills if that is how you worked before.

## Repository layout

```
lib/index.js          host half (skills + prompt section)
lib/client.js         client half (composer-dock pill)
cordis.patch.yml      one insert row: id ponytail -> @chonwai/dsh-ponytail
skills/<6>/SKILL.md   vendored Ponytail v5.3.3 skills (byte-identical)
rules.md              scoped rules injected as a prompt section
locale/{en,zh}.json   plugin-page title/description/detail
icon.svg              original icon
checksums.txt         sha256 pins for skills + rules
tests/                offline-check.sh, host-smoke.mjs, client-smoke.mjs
INSTALL.md            detailed install / migration / rollback / troubleshooting
```

## License and attribution

MIT — see [`LICENSE`](LICENSE). The six skill files are vendored from
[Ponytail](https://github.com/DietrichGebert/ponytail) v5.3.3 (MIT, Copyright (c) 2026
DietrichGebert); `rules.md` contains the upstream `AGENTS.md` text verbatim plus a
Traditional-Chinese scope note. See [`NOTICE`](NOTICE) for the full attribution.
