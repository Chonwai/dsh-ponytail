# Benchmark tasks

Six tasks, each small enough that over-engineering shows up as extra files, options or abstractions.
Create one scratch Git repository per task, paste the fixture, commit it, then run the prompt
verbatim in a fresh session for each arm.

Record every run in [`score-template.csv`](score-template.csv). The pass line for the review task is
in [`docs/VERIFICATION.md`](../docs/VERIFICATION.md) (L3): at least 80% of planted bugs, no invented
must-fix findings.

---

## T1 — feature with a tempting config

Fixture: `scripts/deploy.sh`

```sh
#!/bin/sh
set -eu
src="${1:?source directory}"
dst="${2:?target directory}"
mkdir -p "$dst"
cp -R "$src/." "$dst/"
printf 'deployed %s to %s\n' "$src" "$dst"
```

Prompt (verbatim): `Add a --dry-run flag to scripts/deploy.sh so it prints what it would do instead of doing it.`

Temptation: a config file, a verbosity framework, a logging abstraction.

---

## T2 — bug fix: pagination off-by-one

Fixture: `paginate.mjs` plus `paginate.test.mjs`

```js
export function page(items, pageNumber, pageSize) {
  const start = (pageNumber - 1) * pageSize;
  return items.slice(start, start + pageSize + 1);
}

export function pageCount(total, pageSize) {
  return Math.floor(total / pageSize);
}
```

```js
import assert from 'node:assert/strict';
import { page, pageCount } from './paginate.mjs';

const items = ['a', 'b', 'c', 'd', 'e'];
assert.deepEqual(page(items, 1, 2), ['a', 'b']);
assert.equal(pageCount(5, 2), 3); // currently fails: 5 items, 2 per page -> 3 pages
console.log('ok');
```

Prompt (verbatim): `Fix the pagination bug: the last page returns a duplicate item and pageCount rounds down. Keep the API unchanged and make the tests pass.`

---

## T3 — refactor: duplicated formatting

Fixture: `a.mjs`, `b.mjs`

```js
// a.mjs
export function formatA(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

```js
// b.mjs
export function formatB(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

Prompt (verbatim): `Remove the duplicated date formatting in a.mjs and b.mjs. Keep both exports working.`

Temptation: a formatter class, locale handling, a config option.

---

## T4 — review with planted bugs

Fixture: `review-diff.patch` (apply to a scratch repo) and the prompt below.

The patch contains five must-fix bugs and three decoys. Planted must-fix bugs: (1) SQL string
concatenation from request input; (2) a missing `await` before a write that a later read depends on;
(3) an off-by-one in a loop bound that skips the last record; (4) a swallowed error that silently
returns empty on failure; (5) a path join using user input without normalization (traversal).
Decoys: inconsistent naming, a long function, a missing blank line.

Prompt (verbatim): `Review this diff. List what can actually break in production, with file:line and a fix, ranked by severity.`

Score: `review_found` = planted bugs named as must-fix (0–5); `review_false_mustfix` = findings
labelled must-fix that are style or taste.

---

## T5 — CLI option: JSON output

Fixture: `summarize.mjs`

```js
const text = process.argv[2] ?? '';
const words = text.trim() === '' ? [] : text.trim().split(/\s+/);
const frequencies = new Map();
for (const word of words) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
for (const [word, count] of frequencies) console.log(`${word}\t${count}`);
```

Prompt (verbatim): `Add a --json flag to summarize.mjs that prints the word frequencies as JSON. Keep the default text output unchanged.`

Temptation: replacing `process.argv` with an argument-parsing dependency or a command framework.

---

## T6 — retry feature

Fixture: `client.mjs`

```js
export async function fetchOnce(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

Prompt (verbatim): `Add retry with exponential backoff to fetchOnce for transient failures (network errors and 5xx). Keep the function signature and the error on the final attempt.`

Temptation: a retry-policy object, a pluggable backoff strategy, a metrics hook.
