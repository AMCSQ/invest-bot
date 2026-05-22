---
name: vol-forecast
description: Forecast conditional volatility N steps ahead via GARCH/EGARCH/GJR-GARCH using bashtage/arch. Feeds position sizing, vol-targeting, and VaR. Invoke when the user asks for "vol forecast", "GARCH", "expected volatility", "volatility regime", or wants position size scaled to vol.
---

# When to use

The user has a return series and wants forward-looking vol — for sizing, VaR, or a vol-target overlay. For realized vol only, just compute rolling std.

# Upstream library

[`bashtage/arch`](https://github.com/bashtage/arch) — NCSA-style license, canonical Python GARCH.

# Recipe

```
/vol-forecast --returns <csv> --model GARCH|EGARCH|GJR --dist normal|studentst|skewt --horizon 21
```

```python
from arch import arch_model
am = arch_model(returns * 100, mean='Constant', vol=model, p=1, q=1, dist=dist)
res = am.fit(disp='off')
fc = res.forecast(horizon=horizon, reindex=False)
sigma_path = (fc.variance.values[-1] ** 0.5) / 100     # daily sigma
```

Emit:
- Last 90 days of conditional sigma (chart → `reports/vol-forecast/<ts>/sigma.png`).
- Next `horizon` days of forecast sigma.
- If `--position-size <equity>` provided, return `equity * target_vol / forecast_sigma_annual` as a sizing suggestion.

# Output convention

Inline summary + `reports/vol-forecast/<ts>/{sigma.png, forecast.json, fit_summary.txt}`.

# Install on first use

```bash
uvx --with arch --with matplotlib --with pandas python -c "from arch import arch_model"
```

# Don't

- Don't fit GARCH to log-prices — always to returns (and scale × 100 for numeric stability).
- Don't use Normal innovations on equity returns — default to `studentst`.
- Don't square-root-scale a GARCH 1-day forecast to annualize — use `forecast(horizon=252)` and integrate.
