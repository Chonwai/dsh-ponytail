# A/B benchmark kit

This directory holds the runnable part of level 3 in [`docs/VERIFICATION.md`](../docs/VERIFICATION.md):
six small tasks, a score sheet and the fairness rules. The question it answers is narrow and honest:
**with the bundle on versus off, does the same model produce smaller, safer changes — and does the
review skill catch real bugs?**

## What you need

- One DSH profile with this bundle installed and enabled.
- A model you will hold fixed for every run, at a fixed reasoning effort.
- A scratch Git repository per task; paste the fixture files from [`tasks.md`](tasks.md).
- Fresh sessions: one run per session, never two arms in one session (context carries over).
- A blind judge: a fresh session, another agent or a human that sees only the prompt, the diff and
  the test output — never the arm.

## How to run

1. Prepare the scratch repo for a task from `tasks.md`; commit the fixture as the baseline.
2. Coin flip for the arm. A = bundle enabled (`defaultMode: full`); B = bundle disabled or `off`.
3. Start a fresh session in the scratch repo, paste the task prompt **verbatim**, let the agent
   finish, and keep the session.
4. Record the diff and the numbers in [`score-template.csv`](score-template.csv):
   `git diff --numstat` for files/lines, the test command result, the wall clock, and the token
   counts if the UI shows them.
5. For the review task, record how many planted bugs were named as must-fix and how many invented
   must-fix findings appeared.
6. Strip the arm label, then hand the prompt + diff + test output to the blind judge for the two
   1–5 scores.
7. Repeat the same task in the other arm, in a fresh session, with the same prompt.

Six tasks × two arms = twelve runs. Halve that by testing three tasks if you only need a smoke
signal; say so when you report.

## Scoring and the decision rule

The pre-registered rule is in [`docs/VERIFICATION.md`](../docs/VERIFICATION.md), L3. Do not change
it after seeing the data. Report per-task paired deltas, the direction count, and the median; state
that n = 6 is indicative. A negative result is a result: if the bundle does not buy smaller diffs on
your model, publish that instead of the number you hoped for.

## Rules that keep the comparison honest

- Same model, same reasoning effort, same tools, same repository state, same prompt text.
- Randomize arm order per task; do not run all A then all B on the same day if the provider changes
  under you.
- Never tell the agent which arm it is in, and never mention Ponytail by name unless the task prompt
  does.
- Judge before you look at the arm labels, and keep the scores in the sheet even when they contradict
  the hypothesis.
- Do not cherry-pick tasks or runs. Keep every run you started in the sheet, including abandoned ones
  (mark them `notes=abandoned`).
