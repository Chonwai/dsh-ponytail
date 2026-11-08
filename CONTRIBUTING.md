# Contributing to @chonwai/dsh-ponytail

Thanks for helping. This package is intentionally small: a host half, a client
half, six vendored skills and one rules document. Please keep it that way.

New to the code? Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first: it
covers the two halves, the skill load contract and what the row toggle does.

## Ground rules

- **No runtime dependencies.** The bundle must install and run from a plain
  package directory. Do not add `dependencies`, `peerDependencies`, a bundler or
  a build step without discussing it in an issue first.
- **No process, network or filesystem side effects.** The host half may read
  files inside this package only. Do not spawn processes, open sockets, write
  outside the package, read `$HOME`, or add telemetry.
- **Do not edit vendored skills.** `skills/*/SKILL.md` are byte-identical copies
  of Ponytail v5.3.3. Local behavior changes belong in `rules.md` (documented as
  a derivative) or in the plugin code, never in the vendored files.
- **Keep the client half a decoration.** The composer dock belongs to the host.
  The pill is non-interactive, uses `--dsw-*` theme tokens, does not import
  other client packages and does not read or replace host DOM.

## Development

Requirements: Node.js 22.19+ (or 24+), `python3` with PyYAML for the offline
checks, and a POSIX shell. No `npm install` is needed: the repository *is* the
package and the scripts are plain Node/POSIX commands.

```bash
npm test          # acceptance gate: offline checks, prints RESULT: PASS
npm run check     # node --check on lib/ and tests/
npm run smoke     # offline host + client smoke suites
```

The offline check is the acceptance gate: it must print `RESULT: PASS`. It never
touches a DSH profile, `$HOME`, the Loader or the network.

## Changing the vendored upstream

1. Take the new Ponytail release tag (do not follow `main`).
2. Replace `skills/*/SKILL.md` with the tag's files, byte-identical.
3. Update `rules.md` only if the upstream `AGENTS.md` changed; keep the English
   text verbatim and keep the Traditional-Chinese scope note.
4. Regenerate the pins and keep the header comments:

   ```bash
   { head -3 checksums.txt; shasum -a 256 skills/*/SKILL.md rules.md; } > checksums.tmp
   mv checksums.tmp checksums.txt
   ```

5. Update `NOTICE` (version, tag, release date) and `CHANGELOG.md`.
6. Run `bash tests/offline-check.sh` and, in a canary DSH profile, the live
   verification steps from `INSTALL.md`.

## Pull requests

- Keep one logical change per PR; explain the user-visible effect.
- Include the `offline-check.sh` summary in the PR description.
- Update `CHANGELOG.md` under `## [Unreleased]` when behavior changes.
- If a change touches the client half, state which slot and order it uses and
  attach a description or screenshot of what you observed (a live check is the
  only proof of rendering).
- By contributing you agree to license your contribution under the MIT License.
