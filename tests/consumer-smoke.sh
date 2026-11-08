#!/usr/bin/env bash
# Consumer smoke test: what a stranger actually downloads.
#
# `npm test` runs the gates in the repository. A consumer gets the *tarball*: a
# subset of the repo, no tests/, installed by path or from a registry. This test
# packs the tarball, extracts it somewhere awkward (spaces in the path), and
# proves the shipped artifact is complete and loadable.
#
#   bash tests/consumer-smoke.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/rein-consumer.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

pass=0
fail=0
ok() { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s\n' "$1"; }

# npm needs a writable cache; the user's ~/.npm cache can be root-owned in some
# environments and must not make this gate flaky.
export npm_config_cache="$TMP/npm-cache"
mkdir -p "$npm_config_cache"

echo "== pack the artifact"
tarball="$(cd "$ROOT" && npm pack --silent --pack-destination "$TMP" 2>/dev/null | tail -1)"
if [ -n "$tarball" ] && [ -f "$TMP/$tarball" ]; then ok "npm pack produced $tarball"; else bad "npm pack produced no tarball"; exit 1; fi

extract_root="$TMP/a directory with spaces"
mkdir -p "$extract_root"
tar -xzf "$TMP/$tarball" -C "$extract_root"
pkg="$(find "$extract_root" -mindepth 1 -maxdepth 1 -type d -name package -print -quit)"
if [ -n "$pkg" ]; then ok "tarball extracts (inside a path with spaces)"; else bad "tarball did not extract"; exit 1; fi

echo "== expected files"
for path in \
  package.json lib/index.js lib/client.js rules.md icon.svg \
  skills/ponytail/SKILL.md skills/ponytail-review/SKILL.md skills/ponytail-audit/SKILL.md \
  skills/ponytail-debt/SKILL.md skills/ponytail-gain/SKILL.md skills/ponytail-help/SKILL.md \
  locale/en.json locale/zh.json checksums.txt \
  README.md README.zh-TW.md INSTALL.md LICENSE NOTICE CHANGELOG.md \
  docs/ARCHITECTURE.md docs/BRANDING.md docs/VERIFICATION.md; do
  if [ -f "$pkg/$path" ]; then ok "shipped: $path"; else bad "missing from tarball: $path"; fi
done
if [ -e "$pkg/tests" ]; then bad "tarball unexpectedly ships tests/"; else ok "tests/ not shipped (dev-only)"; fi

echo "== manifest of the shipped package"
if node - "$pkg/package.json" <<'NODE'
const fs = require('node:fs');
const p = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const checks = [
  ['name is @chonwai/dsh-rein', p.name === '@chonwai/dsh-rein'],
  ['version parses', /^\d+\.\d+\.\d+$/.test(p.version)],
  ['declares dsh.bundle.patch', typeof p.dsh?.bundle?.patch === 'string'],
  ['declares dsh.client for the web platform', p.dsh?.client?.platform === 'web'],
  ['no runtime dependencies', Object.keys(p.dependencies || {}).length === 0],
  ['no install scripts', !p.scripts?.install && !p.scripts?.postinstall],
  ['engines.dsh covers the tested window', typeof p.engines?.dsh === 'string'],
  ['keywords keep the upstream name', (p.keywords || []).includes('ponytail')],
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed += 1;
}
process.exit(failed === 0 ? 0 : 1);
NODE
then pass=$((pass + 8)); else bad "shipped manifest checks failed"; fi

echo "== vendored hashes inside the tarball"
if (cd "$pkg" && grep -v '^#' checksums.txt | shasum -a 256 -c - >/dev/null 2>&1); then
  ok "skills + rules.md match checksums.txt in the artifact"
else
  bad "artifact vendored files do not match checksums.txt"
fi

echo "== the host half loads from the artifact"
if node --input-type=module - "$pkg" <<'NODE'
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const pkg = process.argv[2];
const mod = await import(pathToFileURL(join(pkg, 'lib/index.js')).href);
const names = [];
for (const name of mod.SKILL_NAMES) {
  const skill = mod.loadBundledSkill(name);
  if (skill.content.length < 100) throw new Error(`short body for ${name}`);
  names.push(name);
}
if (mod.name !== 'rein') throw new Error(`unexpected plugin name ${mod.name}`);
if (typeof mod.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(mod.version)) throw new Error('bad version export');
console.log(`PASS  host half imports and loads all ${names.length} skills from the artifact`);
NODE
then pass=$((pass + 1)); else bad "host half failed to load from the artifact"; fi

echo "== no absolute paths or secrets in the artifact"
# `/Users/you` and `/home/user` are documentation placeholders, not leaks.
leaks="$(grep -RInE '/Users/[a-z][a-z0-9_-]*|/home/[a-z][a-z0-9_-]*|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]{16,}' "$pkg" 2>/dev/null | grep -vE '/Users/you\b|/home/user\b' || true)"
if [ -n "$leaks" ]; then
  bad "artifact contains an absolute home path or a secret-looking string"
  printf '%s\n' "$leaks" | head -5
else
  ok "artifact contains no absolute home paths or secrets"
fi

echo "== size sanity"
size_kb=$(( $(wc -c < "$TMP/$tarball") / 1024 ))
if [ "$size_kb" -lt 200 ]; then ok "tarball is ${size_kb} kB (no dependency or build balloon)"; else bad "tarball is unexpectedly large: ${size_kb} kB"; fi

echo "------------------------------------------------------------"
if [ "$fail" -ne 0 ]; then
  printf 'RESULT: FAIL (%s checks, %s failed)\n' "$((pass + fail))" "$fail"
  exit 1
fi
printf 'RESULT: PASS (%s checks)\n' "$pass"
