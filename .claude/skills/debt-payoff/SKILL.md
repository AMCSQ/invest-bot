---
name: debt-payoff
description: Generate a debt-payoff schedule using the avalanche (highest-APR first) or snowball (smallest balance first) strategy. Compare total interest paid and months to debt-free. Invoke when the user asks "pay off my debts", "avalanche vs snowball", "credit card payoff plan".
---

# When to use

User supplies one or more debts with balance + APR + min payment, plus an extra monthly amount.

# Upstream libraries / repos

- [`jkugler/debt_snowball`](https://github.com/jkugler/debt_snowball) — Python snowball reference.
- [`skaramicke/python-avalanche`](https://github.com/skaramicke/python-avalanche) — Python avalanche reference.
- [`emberfeather/yeti`](https://github.com/emberfeather/yeti) — Apache-2.0 snowball calculator.

The math is trivial; this skill mostly bundles the right convention + a clean report.

# Recipe

```
/debt-payoff --debts data/debts.yaml --extra 500 --strategy avalanche|snowball|both
```

`data/debts.yaml`:
```yaml
- name: visa
  balance: 6400
  apr: 0.2349
  min_payment: 150
- name: car
  balance: 18200
  apr: 0.0589
  min_payment: 410
```

Algorithm: each month, pay min on all; route the `extra` to the target debt per strategy. When target is cleared, roll its min + extra to the next.

Emit a table of `(month, debt, payment, remaining_balance, interest_paid_this_month)` plus the totals row.

# Output convention

`reports/debt-payoff/<ts>/{schedule.csv, summary.md}`. Summary names the winner: e.g. "Avalanche saves $1,847 over snowball; payoff in 38 vs 41 months."

# Install on first use

```bash
uvx --with pyyaml --with pandas python -c "import pandas"
```

# Don't

- Don't recommend snowball over avalanche purely on math — explicitly note avalanche minimizes interest but snowball builds psychological momentum.
- Don't ignore the user's emergency fund — if no `--emergency-fund-months` is set, ask once before optimizing.
