---
name: pre-trade-checklist
description: Pre-market go / no-go gate. Walks the trader through sleep, prior-day emotional residue, market context, and 5-item playbook recital. Writes `data/state.yaml` that `tilt-guard` reads. Invoke at session start, or when the user says "warmup", "pre-market", "go-no-go", "should I trade today".
---

# When to use

Once per trading session, before any orders. If `data/state.yaml` is missing or stale (> 4 hours old) when `tilt-guard` checks, it fails closed.

# Upstream references

- [`dastergon/postmortem-templates`](https://github.com/dastergon/postmortem-templates) — checklist style.
- [`counteractive/incident-response-plan-template`](https://github.com/counteractive/incident-response-plan-template) — go/no-go gate language.
- [`busterbenson cognitive-bias-cheat-sheet.json`](https://github.com/busterbenson/public/blob/master/cognitive-bias-cheat-sheet.json) — daily bias review.

# Recipe

```
/pre-trade-checklist run
```

Claude asks (one at a time, no skipping):

1. **Sleep**: hours and quality (1-5). Hard-coded: < 6 hours flags `sleep_deficit`.
2. **Prior P&L emotional residue**: rate 1-5. > 3 flags `residue`.
3. **Pre-market routine done**: yes/no (no = `no_routine`).
4. **Macro context**: any scheduled high-impact event today (FOMC / CPI / ER)? `data/calendar.md` (user-maintained).
5. **Playbook recital**: paste your 5 rules from `data/playbook.md` (scaffolded on first run with empty bullets). Forced recital, not skimming.
6. **One bias to watch today** (drawn from cheat-sheet).

# Output

Writes `data/state.yaml`:
```yaml
date: 2026-05-22
session_warmup_completed: true
sleep_hours: 7
sleep_quality: 4
emotional_residue: 2
routine_done: true
high_impact_event: false
playbook_recited: true
bias_to_watch: "loss aversion"
trade_today: true
trade_size_modifier: 1.0     # < 1.0 when sleep_deficit / residue elevated
warmup_at: 2026-05-22T13:25:00Z
```

If any blocker fires (e.g. sleep < 5 + residue > 4), sets `trade_today: false` and `trade_size_modifier: 0`.

# Output convention

```
data/state.yaml
data/playbook.md         # scaffolded on first run
data/calendar.md         # user-maintained
data/journal/warmup/YYYY-MM-DD.md   # narrative record
```

# Install on first use

No deps beyond `pyyaml`.

# Don't

- Don't allow "skip" on any question — refuse and exit non-zero.
- Don't auto-mark `trade_today: true` when blockers are unset — null state ≠ green.
- Don't let `state.yaml` go stale silently — if `tilt-guard` sees `warmup_at > 4h ago`, it must re-prompt.
