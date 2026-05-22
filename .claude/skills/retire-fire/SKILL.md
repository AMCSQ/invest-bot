---
name: retire-fire
description: Run a FIRE retirement simulation — success rate + safe withdrawal — via historical-cycle replay or Monte Carlo. Supports VPW, Guyton-Klinger, CAPE, fixed % rules. Invoke when the user asks "can I retire", "what's my safe withdrawal", "FIRE", "sequence of returns risk", "4% rule".
---

# When to use

User describes savings + spend and wants a confidence number ("X% of historical cycles succeed"). For Social Security claim age, use a sibling skill that wraps `MikePiper/open-social-security`.

# Upstream libraries / repos

- [`boknows/cFIREsim-open`](https://github.com/boknows/cFIREsim-open) — historical-cycle simulator (JS; call via Node or port logic).
- [`theFIcalculator/advanced-fire-calculator`](https://github.com/theFIcalculator/advanced-fire-calculator) — MIT; VPW, Guyton-Klinger, CAPE rules.
- [`carlchizhang/fireCalc`](https://github.com/carlchizhang/fireCalc) — MIT Monte Carlo on Shiller data.
- [`mdlacasse/Owl`](https://github.com/mdlacasse/Owl) — GPL; tax-aware withdrawal LP (use as external CLI).

# Recipe

```
/retire-fire --portfolio 1500000 --withdrawal 60000 --years 40 \
  --equity 0.7 --bonds 0.3 --rule fixed|vpw|guyton-klinger|cape \
  --mode historical|monte-carlo --inflation cpi-adjusted
```

1. Fetch annual real returns: Shiller dataset (cached under `data/shiller/`).
2. **historical mode**: roll start year from 1871..2025-years, simulate each cycle, count success (portfolio > 0 at end).
3. **monte-carlo mode**: bootstrap annual returns (block size 5 to keep mild autocorrelation), 10,000 paths.
4. Emit success rate, 5/50/95th percentile final portfolio, median worst-drawdown year, worst start year.

# Output convention

`reports/retire-fire/<ts>/{summary.md, cycles.csv, fan_chart.png}`.

# Install on first use

```bash
uvx --with pandas --with numpy --with matplotlib python -c "import numpy"
```

# Don't

- Don't claim "100% success" — quote it as "of N historical/simulated cycles, M failed".
- Don't ignore taxes — flag that this is pre-tax unless `--tax-bracket` is supplied (then chain to Owl).
- Don't use the 4% rule for 40+ year horizons without warning — historical safe rate drops to ~3.3% for 50yr.
