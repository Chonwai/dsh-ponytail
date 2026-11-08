# Verification: how to prove this bundle works

A bundle can install cleanly and still be broken. Version 1.0.0 did exactly that: the six skills
appeared in the catalog, but every `skill(...)` call threw `source must be a string` because
`skills.register()` and the load path validate different fields. The lesson is the rule below:
**a check only counts when it exercises the layer that can fail.**

Run all four levels before claiming "it works". Each level names the command or observation, the pass
criterion, and what it cannot prove.

## L0 — Package contract (offline, minutes, no DSH profile)

```bash
npm test        # acceptance gate: prints RESULT: PASS (81 checks)
npm run check   # node --check on lib/ and tests/
npm run smoke   # offline host and client smoke suites
```

What it covers: manifest, exports, `files`, locales and icon parse; `dsh.bundle.patch` and
`dsh.client` are declared; the six vendored skills match `checksums.txt` (upstream v5.3.3
byte-for-byte); the host half registers six skills in a fake Cordis context **and the payload passes
the load-path contract** (`source`, name, description, content); the client module matches the
decoration template; the host half contains no `child_process`, `fetch`, socket or write calls.

What it cannot prove: a real Loader mount, a real skill load, the prompt section actually reaching a
model, or anything on screen. CI runs this level on Node 22 and 24 for every push and pull request.

## L1 — Installation reality (one managed DSH profile)

| Check | How | Pass criterion |
|---|---|---|
| dependency | `dependencies["@chonwai/dsh-rein"]` in the profile `package.json` | `link:<path>` or the published version |
| selection | `dsh.profile.bundles` in the same file | contains `@chonwai/dsh-rein` |
| package link | `readlink <profile>/node_modules/@chonwai/dsh-rein` | resolves to the package directory |
| Loader row | Cordis Config inspector: `listConfigs { name: "@chonwai/dsh-rein" }` | an entry with patch id `rein` and name `@chonwai/dsh-rein` (the entry detail shows its `packageDir` when the inspector exposes it) |
| bundle listing | `plugin_manager` → `list_bundles` | `availability: "profile"`, `installed: true`, `enabled: true`, `removable: true`, expected version |
| no duplicate source | `$DSH_HOME/skills` and `~/.agents/skills` | no `ponytail*` directories (unless you intend the file-level install) |

Record the outputs. A clean profile state does not prove behavior, but a dirty one invalidates L2.

## L2 — Live behavior (a running DSH session)

| # | Check | Pass criterion |
|---|---|---|
| 1 | Fresh session skill catalog | lists `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help` |
| 2 | Load every skill: `skill("<name>")` for all six | each returns `<skill_content>`; two bodies match `skills/<name>/SKILL.md` after frontmatter removal |
| 3 | `/ponytail` as a user gesture | loads the core skill into that step |
| 4 | Always-on rules | the scoped block from `rules.md` appears in the session instructions; with `defaultMode: off` it disappears and the skills stay |
| 5 | Composer pill | `conversation.composer.dock` has occupant `ponytail` (order 2, active) **and** a human or screenshot confirms a visible pill |
| 6 | Plugins page | after a reload the bundle card is visible; details read the README |
| 7 | Reversibility | toggle the bundle off → catalog loses the six names and the rules; toggle on → restored; remove → dependency and layer gone |

Item 2 is the one that caught 1.0.0. Items 5 and 6 are the only ones a human must look at; the rest
leave command output or a transcript behind.

## L3 — Behavioral effect: does Ponytail change the output? (A/B)

This is the only level that answers "is the tool useful", and the only one where an honest negative
result is possible. The kit lives in `bench/`; the protocol:

1. **Arms.** A = bundle enabled (`defaultMode: full`). B = bundle disabled or `defaultMode: off`.
2. **Controls.** Same model and reasoning effort, same DSH version, one fresh session per run, the
   exact prompt from `bench/tasks.md`, no extra instructions. Randomize the order with a coin flip.
3. **Tasks.** Six small tasks chosen so over-engineering is visible: one feature with a tempting
   config, one bug fix, one refactor, one review with planted bugs, one CLI option, one retry feature.
4. **Metrics** (per run, into `bench/score-template.csv`): files changed, lines added/removed, tests
   added, tests pass, unrequested abstractions, judge correctness 1–5, judge scope discipline 1–5,
   wall time, tokens if the UI shows them.
5. **Blind judging.** Strip arm labels from the diff and the transcript before judging. Score
   correctness and scope discipline from the prompt, the diff and the test output only.
6. **Pre-registered decision rule.** Call it "works on this machine" only if all hold:
   - no correctness regression (tests still pass; judge correctness of A is not lower than B);
   - at least 4 of 6 tasks have A's lines-added ≤ B's;
   - blind scope-discipline median of A is at least B's;
   - in the review task, A catches at least 80% of the planted must-fix bugs without inventing
     "must fix" findings that are not real.

   n = 6 per arm is indicative, not publishable. Report the per-task deltas and the direction count;
   do not turn a 3-line reduction into a marketing number. If the rule fails, publish that result
   rather than moving the thresholds.

## L4 — Continuous verification

- CI runs L0 on every push and pull request; a red run blocks merging.
- Monthly upstream check: latest tag vs the pin in `checksums.txt`
  (`gh api repos/DietrichGebert/ponytail/releases/latest`). A newer tag means the upgrade flow in
  `CONTRIBUTING.md`, then L0 and L2 again.
- Every DSH upgrade: re-run L1 and L2, then a three-task L3 sample. The `engines.dsh` window is
  `>=0.2.2-rc.1 <0.3.0`; anything outside it is untested.
- Inbound reports arrive through the issue template and are labelled per area; a regression is only
  closed with an L2 row and, when behavior is involved, an L3 run.
- Adoption signals (issues, stars, downloads once published) say the tool is used; they say nothing
  about quality. They do not replace L0–L3.

## What this protocol deliberately does not do

- It does not reproduce or validate upstream Ponytail's published savings; that benchmark used a
  different model and harness.
- It does not prove the pill's aesthetics or the bundle card's localized title, only that the
  mechanisms are registered; a human check is the proof for pixels.
- It does not replace team judgment about whether "lazy mode" fits a codebase's conventions.
