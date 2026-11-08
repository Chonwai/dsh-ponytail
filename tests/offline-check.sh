#!/usr/bin/env bash
# Static, offline checks for @chonwai/dsh-rein.
#
# Verifies the package without touching a DSH profile, the Loader, pnpm, the
# network or $HOME: manifest/YAML/JSON structure, JavaScript syntax, the client
# artifact contract, vendored skill checksums, locale/icon/docs presence and the
# forbidden-API scan. Then runs the offline host and client smoke tests.
#
#   bash tests/offline-check.sh
#
# Exit 0 = all checks pass; 1 = any failure; 2 = environment problem.
set -u

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
PASS=0
FAIL=0
FAILED_LIST=""

ok() {
  PASS=$((PASS + 1))
  printf 'PASS  %s\n' "$*"
}
bad() {
  FAIL=$((FAIL + 1))
  FAILED_LIST="$FAILED_LIST
  - $*"
  printf 'FAIL  %s\n' "$*"
}
hr() { printf '%s\n' "------------------------------------------------------------"; }

# sha256 helpers: use shasum when present (macOS), sha256sum otherwise (CI images).
sha256_of() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{ print $1 }'
  else
    sha256sum "$1" | awk '{ print $1 }'
  fi
}
sha256_check() { # <checksums file>
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "$1" >/dev/null 2>&1
  else
    local filtered
    filtered=$(mktemp "${TMPDIR:-/tmp}/dsh-rein-checksums.XXXXXX")
    grep -v '^#' "$1" > "$filtered"
    sha256sum -c "$filtered" >/dev/null 2>&1
    local status=$?
    rm -f "$filtered"
    return $status
  fi
}

cd "$PACKAGE_DIR" || { echo "cannot cd to package dir"; exit 2; }
hr
printf 'offline check: @chonwai/dsh-rein\n'
printf 'package: %s\n' "$PACKAGE_DIR"
hr

manifest() { # <dot.path> -> value or "no"
  node -e '
    const fs = require("node:fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    let value = pkg;
    for (const key of process.argv[2].split(".")) {
      value = value === undefined || value === null ? undefined : value[key];
    }
    process.stdout.write(value === undefined ? "no" : "yes");
  ' "$PACKAGE_DIR/package.json" "$1"
}

manifest_value() { # <dot.path> -> printed value (empty when missing)
  node -e '
    const fs = require("node:fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    let value = pkg;
    for (const key of process.argv[2].split(".")) {
      value = value === undefined || value === null ? undefined : value[key];
    }
    process.stdout.write(value === undefined ? "" : String(value));
  ' "$PACKAGE_DIR/package.json" "$1"
}

# 1. Manifest JSON and required identity fields.
if node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))' "$PACKAGE_DIR/package.json" 2>/dev/null; then
  ok "package.json parses as JSON"
else
  bad "package.json does not parse"
fi
for field in name version description license author homepage repository.url bugs.url type main exports icon files dsh.bundle.patch dsh.client.platform dsh.client.immediately dsh.client.inject engines.node engines.dsh; do
  if [ "$(manifest "$field")" = "yes" ]; then ok "package.json has $field"; else bad "package.json is missing $field"; fi
done
[ "$(manifest_value name)" = "@chonwai/dsh-rein" ] && ok "package name is @chonwai/dsh-rein" || bad "package name is wrong"
[ "$(manifest_value version)" = "2.0.0" ] && ok "package version is 2.0.0" || bad "package version is not 2.0.0"
lib_version=$(grep -oE "export const version = '[^']+'" "$PACKAGE_DIR/lib/index.js" | sed -E "s/.*'([^']+)'/\1/")
[ "$lib_version" = "$(manifest_value version)" ] && ok "lib/index.js version matches package.json" || bad "lib/index.js version (${lib_version:-missing}) does not match package.json"
[ "$(manifest_value license)" = "MIT" ] && ok "package license is MIT" || bad "package license is not MIT"
if node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.exit(Object.keys(p.dependencies||{}).length===0?0:1)' "$PACKAGE_DIR/package.json"; then
  ok "package has no runtime dependencies"
else
  bad "package must not declare runtime dependencies"
fi

# Discoverability guard: the upstream and former names must survive in the
# manifest even though the package slug is Rein. Losing them silently means
# losing the search traffic that finds the project at all.
if node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.exit((p.keywords||[]).includes("ponytail")?0:1)' "$PACKAGE_DIR/package.json"; then
  ok "keywords keep the upstream name: ponytail"
else
  bad "keywords must include ponytail (search discoverability)"
fi
if node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.exit((p.keywords||[]).includes("dsh-ponytail")?0:1)' "$PACKAGE_DIR/package.json"; then
  ok "keywords keep the former name: dsh-ponytail"
else
  bad "keywords must include dsh-ponytail (old-name discoverability)"
fi
if node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.exit(/Ponytail/.test(p.description||"")?0:1)' "$PACKAGE_DIR/package.json"; then
  ok "description keeps the upstream name: Ponytail"
else
  bad "description must mention Ponytail (package search)"
fi
if node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));const need=["." ,"./client","./cordis.patch.yml","./locale/*.json","./icon","./package.json"];process.exit(need.every(k=>k in p.exports)?0:1)' "$PACKAGE_DIR/package.json"; then
  ok "package exports the required entry points"
else
  bad "package exports are incomplete"
fi
for export_path in "$(manifest_value main)" "$(node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(p.exports["./client"])' "$PACKAGE_DIR/package.json")"; do
  if [ -f "$PACKAGE_DIR/$export_path" ]; then ok "entry point exists: $export_path"; else bad "entry point missing: $export_path"; fi
done

# 2. Bundle patch and client manifest.
if [ -f "$PACKAGE_DIR/$(manifest_value dsh.bundle.patch)" ]; then
  ok "dsh.bundle.patch points at an existing file"
else
  bad "dsh.bundle.patch does not resolve"
fi
if python3 - "$PACKAGE_DIR/cordis.patch.yml" <<'PY'
import sys, yaml
data = yaml.safe_load(open(sys.argv[1], encoding='utf-8'))
assert isinstance(data, list) and len(data) == 1, 'one top-level patch expected'
rows = data[0].get('insert')
assert isinstance(rows, list) and len(rows) == 1, 'exactly one inserted row expected'
row = rows[0]
assert row.get('id') == 'rein', 'row id must be rein'
assert row.get('name') == '@chonwai/dsh-rein', 'row name must be the package'
assert isinstance(row.get('config', {}).get('defaultMode'), str), 'config.defaultMode must be a string'
assert 'config' in row and row['config'], 'the row carries its default config'
PY
then
  ok "cordis.patch.yml parses with one rein insert row"
else
  bad "cordis.patch.yml is invalid (must be one insert row for @chonwai/dsh-rein)"
fi
inject_value=$(node -e 'const p=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(JSON.stringify(p.dsh.client.inject))' "$PACKAGE_DIR/package.json")
if [ "$inject_value" = '["@deepseek-ai/dsh-client-ui-conversation"]' ]; then
  ok "dsh.client injects @deepseek-ai/dsh-client-ui-conversation"
else
  bad "dsh.client.inject must be exactly [\"@deepseek-ai/dsh-client-ui-conversation\"] (got $inject_value)"
fi
if [ "$(manifest_value dsh.client.platform)" = "web" ] && [ "$(manifest_value dsh.client.immediately)" = "true" ]; then
  ok "dsh.client declares platform web and immediately true"
else
  bad "dsh.client platform/immediately are wrong"
fi

# 3. Locales, detail documents and icon.
for language in en zh; do
  if python3 - "$PACKAGE_DIR/locale/$language.json" "$PACKAGE_DIR" <<'PY'
import json, os, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
meta = data.get('meta', {})
assert isinstance(meta.get('title'), str) and meta['title'].strip(), 'meta.title required'
assert isinstance(meta.get('description'), str) and meta['description'].strip(), 'meta.description required'
detail = meta.get('detail')
assert isinstance(detail, str), 'meta.detail required'
assert os.path.isfile(os.path.join(sys.argv[2], detail)), 'meta.detail must name an existing file'
PY
  then
    ok "locale/$language.json is valid (title, description, detail)"
  else
    bad "locale/$language.json is invalid"
  fi
done
[ "$(node -e 'const p=require(process.argv[1]);process.stdout.write(p.meta.detail)' "$PACKAGE_DIR/locale/en.json")" = "README.md" ] && ok "locale/en.json detail targets README.md" || bad "locale/en.json detail must target README.md"
[ "$(node -e 'const p=require(process.argv[1]);process.stdout.write(p.meta.detail)' "$PACKAGE_DIR/locale/zh.json")" = "README.zh-TW.md" ] && ok "locale/zh.json detail targets README.zh-TW.md" || bad "locale/zh.json detail must target README.zh-TW.md"
icon_rel=$(manifest_value icon)
if [ -f "$PACKAGE_DIR/$icon_rel" ] && head -c 4 "$PACKAGE_DIR/$icon_rel" | grep -q '<svg'; then
  ok "icon exists and starts with <svg"
else
  bad "icon is missing or malformed"
fi
icon_bytes=$(wc -c < "$PACKAGE_DIR/$icon_rel" | tr -d ' ')
if [ "$icon_bytes" -le 262144 ]; then ok "icon is within the 256 KiB limit ($icon_bytes bytes)"; else bad "icon exceeds 256 KiB"; fi

# 4. JavaScript syntax and the client artifact contract.
for file in lib/index.js lib/client.js tests/host-smoke.mjs tests/client-smoke.mjs; do
  if node --check "$file" 2>/dev/null; then ok "node --check $file"; else bad "node --check $file"; fi
done
client_checks_ok=1
check_client() { # <description> <grep pattern>
  if grep -qF -- "$2" lib/client.js; then ok "client.js $1"; else bad "client.js is missing $1"; client_checks_ok=0; fi
}
check_client "registers through window.__ModuleLoader__" '__ModuleLoader__.load'
check_client "declares the package-name factory id" "id: '@chonwai/dsh-rein'"
check_client "requires React from the browser module table" "require('react')"
check_client "injects the composer dock slot" 'conversation.composer.dock'
check_client "uses slot id ponytail" "id: 'ponytail'"
check_client "registers at order 2" 'order: 2'
check_client "disables pointer events" "pointerEvents: 'none'"
check_client "uses theme tokens" '--dsw-alias-'
if grep -En '^\s*import\s|[^:]document\.body|\bfetch\s*\(|XMLHttpRequest|https?://' lib/client.js >/dev/null 2>&1; then
  bad "client.js contains an ESM import, DOM write, network call or absolute URL"
else
  ok "client.js contains no ESM imports, DOM writes or network calls"
fi
if [ "$client_checks_ok" -eq 1 ]; then ok "client artifact matches the decoration template contract"; fi

# 5. Vendored files and checksums.
if sha256_check checksums.txt; then
  ok "checksums.txt verifies (6 skills + rules.md)"
else
  bad "checksums.txt does not verify; regenerate it (keep the header comments) and re-run"
fi
skill_count=$(find skills -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
[ "$skill_count" -eq 6 ] && ok "exactly six bundled skills" || bad "expected 6 skill directories, found $skill_count"
for skill in ponytail ponytail-review ponytail-audit ponytail-debt ponytail-gain ponytail-help; do
  [ -f "skills/$skill/SKILL.md" ] && ok "skill present: $skill" || bad "missing skill: $skill"
done
# The vendored skills are byte-identical to upstream v5.3.3; the pinned hashes
# above are the upstream ones, recorded in checksums.txt and NOTICE.
rules_ok=1
for needle in '適用範圍' '只約束 code changes' 'smallest complete change' 'github.com/DietrichGebert/ponytail' 'MIT' '出處與授權'; do
  if grep -qF "$needle" rules.md; then :; else rules_ok=0; bad "rules.md is missing: $needle"; fi
done
[ "$rules_ok" -eq 1 ] && ok "rules.md carries the scope notice, vendored rules and attribution"
if grep -qF 'v5.3.3' checksums.txt && grep -qF 'DietrichGebert/ponytail' checksums.txt; then
  ok "checksums.txt notes the upstream tag and source"
else
  bad "checksums.txt must note the upstream tag v5.3.3 and source URL"
fi

# 6. Host half: no process, network, home writes; reads only its own files.
HOST_FORBIDDEN='child_process|execSync|execFileSync|\bspawn\b|execFile\(|fetch\(|XMLHttpRequest|http\.request|https\.request|node:net|node:http|node:https|writeFile|appendFile|createWriteStream|mkdirSync|homedir\(|node:os'
if grep -En "$HOST_FORBIDDEN" lib/index.js >/dev/null 2>&1; then
  bad "lib/index.js contains a forbidden process/network/write/home API"
else
  ok "lib/index.js has no process, network, write or home API"
fi
if grep -qF 'readFileSync' lib/index.js && grep -qF 'node:fs' lib/index.js; then
  ok "lib/index.js only reads package files (node:fs readFileSync)"
else
  bad "lib/index.js is expected to read its bundled files with node:fs readFileSync"
fi
if grep -qF 'PACKAGE_ROOT' lib/index.js; then ok "host paths resolve from the package root"; else bad "host paths must resolve from the package root"; fi

# 7. Open-source repository files.
for file in README.md README.zh-TW.md INSTALL.md LICENSE NOTICE CHANGELOG.md CONTRIBUTING.md SECURITY.md .gitignore .github/workflows/ci.yml; do
  [ -f "$file" ] && ok "repo file present: $file" || bad "missing repo file: $file"
done
if grep -qF 'MIT' LICENSE && grep -qF 'Chonwai' LICENSE; then ok "LICENSE is MIT and names the author"; else bad "LICENSE must be MIT and name the author"; fi
if grep -qF 'DietrichGebert' NOTICE && grep -qF 'v5.3.3' NOTICE && grep -qF 'MIT' NOTICE; then
  ok "NOTICE carries the upstream attribution"
else
  bad "NOTICE must carry the ponytail v5.3.3 MIT attribution"
fi
if python3 -c 'import sys, yaml; yaml.safe_load(open(sys.argv[1], encoding="utf-8"))' .github/workflows/ci.yml 2>/dev/null; then
  ok "CI workflow parses as YAML"
else
  bad "CI workflow does not parse as YAML"
fi
if grep -qF 'offline-check.sh' .github/workflows/ci.yml && grep -qF 'node --check' .github/workflows/ci.yml; then
  ok "CI workflow runs node --check and the offline checks"
else
  bad "CI workflow must run node --check and tests/offline-check.sh"
fi

# 8. Offline host and client smoke tests.
if node tests/host-smoke.mjs > /tmp/dsh-rein-host-smoke.log 2>&1; then
  ok "host-smoke.mjs passes ($(grep -c '^PASS' /tmp/dsh-rein-host-smoke.log) checks)"
else
  bad "host-smoke.mjs failed; see /tmp/dsh-rein-host-smoke.log"
fi
if node tests/client-smoke.mjs > /tmp/dsh-rein-client-smoke.log 2>&1; then
  ok "client-smoke.mjs passes ($(grep -c '^PASS' /tmp/dsh-rein-client-smoke.log) checks)"
else
  bad "client-smoke.mjs failed; see /tmp/dsh-rein-client-smoke.log"
fi

hr
if [ "$FAIL" -eq 0 ]; then
  printf 'RESULT: PASS (%s checks)\n' "$PASS"
  exit 0
fi
printf 'RESULT: FAIL (%s passed, %s failed)\n' "$PASS" "$FAIL"
printf 'failed checks:%s\n' "$FAILED_LIST"
exit 1
