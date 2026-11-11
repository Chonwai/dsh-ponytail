# Architecture

This document is for people changing the bundle. It explains why the package has two halves,
which contracts each half must satisfy, and what happens when the row is toggled.

## The shape

```
cordis.patch.yml           one `insert` row: id `rein`, name `@chonwai/dsh-rein`
lib/index.js               host half, runs when the row activates
lib/client.js              client half, runs when the Web client boots
skills/<name>/SKILL.md     six vendored Ponytail skills (upstream v5.3.3)
rules.md                   scoped always-on rules, carried by the host half
locale/{en,zh}.json        display metadata for the bundle card
```

`package.json` connects the parts:

- `dsh.bundle.patch` points at `cordis.patch.yml`, so installing the package installs a patch layer.
- `dsh.client` points the Web client at `lib/client.js` and declares the packages it may require.

The bundle is a **distribution** of upstream Ponytail, not a fork: the six skills are byte-identical
copies, and local behavior lives in `rules.md` and the plugin code (see `NOTICE`).

## Host half — `lib/index.js`

`apply(ctx, config)` does two independent things, and both are optional-service friendly:

1. **Skills.** For each `skills/<name>/SKILL.md` it parses the frontmatter and calls
   `ctx.skills.register({ name, description, whenToUse?, source: 'bundled', content })`.
   Resolution is **layer-first**: the standard Web preset mounts `skill-filesystem` in the agent
   scope and disables the host row, so file copies under `$DSH_HOME/skills`, `~/.agents/skills` or a
   project `.agents/skills` win a duplicate name over these global registrations; ranks only order
   duplicates inside one layer. The host half's `skills.list({})` read is **unscoped** (global layer
   only) and best-effort: it can skip when another *global* provider owns a name, but it cannot see
   scoped file copies and cannot warn about them. Remove file copies for the bundle to take effect.
   Catalog read failures must never disable the bundle; registration then proceeds blind.
2. **Rules.** It reads `rules.md` once and contributes one prompt section through
   `ctx.systemPrompt.section({ name: 'rein-rules', order: 700, text })`. `text` is a function so
   `defaultMode: 'off'` takes effect on the next assembly; the skills stay registered.

`ctx.get(service)` covers a service that is already mounted; `ctx.inject([service])` covers one that
mounts later. Neither is required for the row to activate. Cleanup is registered with `ctx.effect`, so
toggling the row off or removing the bundle releases both registrations.

### The skill load contract

There are two validators, and they differ:

- `skills.register()` runs `validateRuntimeSkill` (name, description, invocation).
- The load path — `skills.get()`, used by both the `skill` tool and the user `/name` gesture — runs
  `validateDefinition`, which additionally requires `source` and `provider` to be strings.

`provider` is defaulted for runtime registrations; `source` is not. A registration without `source`
therefore lists the skill and fails every load with `source must be a string`. Version 1.0.1 fixed
exactly this (`source: 'bundled'`), and `tests/host-smoke.mjs` asserts the payload against the load
contract so the regression cannot pass CI again.

## Client half — `lib/client.js`

A dynamic client module in the documented wrapper form:

```js
window.__ModuleLoader__.load({ id: '@chonwai/dsh-rein', factory(require) { /* ... */ } })
```

It registers one occupant in `conversation.composer.dock` — id `ponytail`, order 2 — and renders a
static, non-interactive pill. It must stay a decoration: `pointer-events: none`, colors from `--dsw-*`
theme tokens, no `fetch`, no DOM outside its own element, no imports of other client packages. If the
slot is unavailable the half degrades to nothing; it can never break the host UI.

## Lifecycle

| Event | Effect |
|---|---|
| Install + enable bundle | patch layer applied, row `rein` activates, host half registers skills + rules |
| Web client boots | client module loads, pill registered in the composer dock |
| Disable bundle (Plugins toggle) | host half disposes: skills disappear from the catalog, rules section is removed. The client half only changes on a Web client load, so an already-open page may keep the pill until a reload |
| Remove bundle | dependency and layer removed; nothing of the package keeps running |
| Change a linked local package | the process may keep the earlier module generation; toggle the bundle off/on (or restart) to remount the host half — see INSTALL.md §8 |

## Security posture

No runtime dependencies, no build step, no telemetry. The host half reads files inside its own
package only: no subprocesses, no sockets, no writes outside the package, no `$HOME` reads. The
client half is inert markup. `checksums.txt` pins every vendored file and CI verifies the pins.

## Upgrading the vendored upstream

See `CONTRIBUTING.md` → "Changing the vendored upstream": take a release tag (not `main`), replace
the skills byte-identically, regenerate `checksums.txt`, update `NOTICE`/`CHANGELOG.md`, run
`npm test`, then repeat the live steps in `INSTALL.md` in a canary profile.
