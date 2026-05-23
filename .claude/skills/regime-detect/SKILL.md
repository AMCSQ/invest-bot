---
name: regime-detect
description: Classify current market regime (e.g. bull / bear / high-vol) for a symbol via a Hidden Markov Model on returns + realized vol. Invoke when the user asks "what regime are we in", "is it trending or chopping", or wants to switch strategies by regime.
---

# When to use

User wants a discrete state label for "now" plus posterior probabilities. For changepoint detection inside a DL pipeline, route to `kieranjwood/slow-momentum-fast-reversion` instead.

# Upstream libraries

- [`hmmlearn`](https://github.com/hmmlearn/hmmlearn) — BSD-3; Gaussian HMM.
- Reference repos: [`Sakeeb91/market-regime-detection`](https://github.com/Sakeeb91/market-regime-detection), [`yvesdhondt/MarketMoodRing`](https://github.com/yvesdhondt/MarketMoodRing).

# Recipe

```
/regime-detect --symbol SPY --states 3 --features returns,realized_vol --window 252
```

1. Pull OHLCV via `market-data`.
2. Build features: `returns = close.pct_change()`, `rv = returns.rolling(window).std() * sqrt(252)`.
3. Fit `GaussianHMM(n_components=states, covariance_type='full', n_iter=200)`.
4. **Stabilize labels**: sort components by mean return ascending → label as `bear`, `neutral`, `bull` (or `bear`/`bull` for 2-state). HMM label IDs are not stable across refits.
5. Output:
   - Current state name + posterior P(state).
   - Mean μ and σ per state.
   - Plot of price colored by regime → `reports/regime-detect/<ts>/regime.png`.

# Output convention

`reports/regime-detect/<symbol>/<ts>/{regime.png, posterior.json, transition_matrix.csv}`.

# Install on first use

```bash
uvx --with hmmlearn --with yfinance --with matplotlib python -c "from hmmlearn.hmm import GaussianHMM"
```

# Don't

- Don't trust label IDs across refits — always re-sort by component mean.
- Don't fit on a window shorter than 252 unless intraday — HMM needs enough regime swings to find them.
- Don't ignore non-stationarity — refit monthly; don't extrapolate a 2010 fit to 2026.
