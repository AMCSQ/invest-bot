---
name: decision-card
description: Annie Duke style pre-mortem in 90 seconds. Captures thesis, three falsifiers, probability estimate, expected R, exit criteria, and the bias most at risk. Stored as a YAML-frontmatter MD file keyed to the order ID, so `trade-journal` and `mistake-miner` can later score predictions vs reality. Invoke when the user is about to place a trade and says "decision card", "pre-mortem", "premortem", "thinking in bets".
---

# When to use

Before every (non-mechanical) discretionary trade. Mechanical signals from a backtested system can skip this.

# Upstream references

- [`busterbenson cognitive-bias-cheat-sheet.json`](https://github.com/busterbenson/public/blob/master/cognitive-bias-cheat-sheet.json) — 175 biases.
- [`dastergon/postmortem-templates`](https://github.com/dastergon/postmortem-templates) — structure for the post-trade review counterpart.

# Recipe

```
/decision-card new --order-id 20260522-AAPL-1 --symbol AAPL --side long
```

Walks the trader through (Claude prompts one question at a time, max 90 seconds total):

1. **Thesis** (one sentence)
2. **3 specific falsifiers** — events that would prove the thesis wrong
3. **Probability of thesis** — 0-100, must be coherent with stated edge
4. **Expected R** — must be consistent with `r_planned` in trade-journal
5. **Exit early if** — concrete, observable
6. **Bias most at risk** — picked from cognitive-bias cheat-sheet (sampled or chosen)

Stores `data/decisions/<order_id>.md`:
```markdown
---
order_id: 20260522-AAPL-1
created_at: 2026-05-22T14:28:00Z
thesis: Earnings gap holds; 200 level is a magnet for ER buyers
falsifiers:
  - VIX > 20 by EOD today
  - 192.50 breaks before 196 prints
  - Tech sector down > 1% intraday
probability: 0.55
expected_R: 1.79
exit_early_if: "tape goes vertical to 199.50 without consolidation"
bias_at_risk: "outcome bias from the QQQ trade last week"
---
```

# Companion: review

```
/decision-card review --order-id 20260522-AAPL-1
```

After the trade closes, computes:
- **Brier score** = `(probability_thesis - thesis_resolved_1_or_0)²`
- Records which falsifier (if any) fired
- Tags the trade with the bias-at-risk for `mistake-miner` aggregation

# Output convention

```
data/decisions/<order_id>.md
data/decisions/calibration.csv     # rolling (probability, outcome, brier) for calibration curve
```

# Install on first use

No deps beyond `pyyaml`.

# Don't

- Don't accept a probability of "high" or "very confident" — only 0-100. Forced quantification is the point.
- Don't let falsifiers be vague ("if it doesn't work") — must be observable and time-bound.
- Don't link to the bias cheat sheet by URL — embed the picked bias's text inline so the user must read it.
