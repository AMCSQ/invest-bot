---
name: statarb-scan
description: Scan a universe for cointegrated pairs (Engle-Granger, Johansen) and rank by half-life + spread Sharpe. Invoke when the user wants "pairs trading", "stat arb", "cointegration scan", or "mean-reverting portfolios".
---

# When to use

User has a basket (≥ 10 symbols) and wants candidate pairs with statistically significant mean reversion. For factor-based long/short equity research, use `alphalens-reloaded` instead.

# Upstream libraries

- [`hudson-and-thames/arbitragelab`](https://github.com/hudson-and-thames/arbitragelab) — source-available, was commercial; verify license terms for your use.
- [`statsmodels`](https://github.com/statsmodels/statsmodels) — BSD-3; `coint` (Engle-Granger), `coint_johansen`.
- Reference notebooks: [`hudson-and-thames/arbitrage_research`](https://github.com/hudson-and-thames/arbitrage_research).

# Recipe

```
/statarb-scan --universe data/universe/sp500.txt --method cointegration --halflife 5-30d --pvalue 0.05
```

1. Pull daily closes for the universe via `market-data`.
2. Pair-wise Engle-Granger: `statsmodels.tsa.stattools.coint(x, y)` → keep pairs with p < `--pvalue`.
3. Compute spread `s = y - β x` (β from OLS), Ornstein-Uhlenbeck fit for half-life.
4. Filter by half-life range and minimum spread Sharpe (assume mean-reversion bands at ±1σ).
5. Output ranked table: `(y, x, β, p, half_life_days, spread_sharpe)`.

# Output convention

`reports/statarb-scan/<ts>/{pairs.csv, top10_spreads.png}` + inline top-10 table.

# Install on first use

```bash
uvx --with statsmodels --with pandas --with matplotlib python -c "from statsmodels.tsa.stattools import coint"
```

# Don't

- Don't ignore multiple-testing — at p=0.05 with 500² pairs you'll get tens of thousands of false positives. Apply Bonferroni or store as candidates only.
- Don't trust cointegration on bull-only history — backtest with structural-break tests (Chow, ADF on residuals rolling).
- Don't naïvely vendor `arbitragelab` — call as external CLI to respect upstream licensing.
