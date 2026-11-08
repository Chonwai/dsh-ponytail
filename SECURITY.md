# Security policy

## Supported versions

| Version | Status |
|---|---|
| 1.0.x | Supported with fixes for security issues |

This package is a DeepSeek Harness bundle that ships instructions (skills and a
rules document) plus a small host plugin and a client decoration.

## What the package can and cannot do

- The host half reads files inside its own package only (`skills/*/SKILL.md`,
  `rules.md`). It does not spawn processes, open sockets, read credentials,
  read `$HOME`, write files, or send telemetry.
- The client half is a static React decoration. It does not fetch, does not
  write DOM outside its own returned element tree, and does not import other
  client packages.
- The bundle has **no dependencies**, so installing it does not pull a
  transitive supply chain. `checksums.txt` pins every vendored file; the offline
  check verifies the pins.
- Loading skills means the model can read the bundled instruction text. This is
  ordinary prompt content; review `rules.md` before enabling the bundle in
  contexts with strict prompt-governance requirements.

## Reporting a vulnerability

Please **do not open a public issue** for a security report. Use GitHub's
private vulnerability reporting on
https://github.com/Chonwai/dsh-ponytail/security/advisories/new (or email the
maintainer listed in `package.json` if that is unavailable). Include:

- affected version / commit,
- the DeepSeek Harness version and profile,
- steps to reproduce and the observed impact,
- whether the issue is in this package or in upstream Ponytail (for upstream,
  report to https://github.com/DietrichGebert/ponytail).

You can expect an initial reply within 7 days. Once a fix is available we will
publish a patched release and credit reporters who want to be named.
