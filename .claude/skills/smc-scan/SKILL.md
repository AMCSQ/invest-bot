---
name: smc-scan
description: Scan a symbol's OHLCV for Smart Money Concept patterns — Fair Value Gaps, Order Blocks, Break of Structure / Change of Character, liquidity sweeps, swing H/L. Invoke when the user mentions "SMC", "ICT", "FVG", "order block", "BOS", "CHoCH", "liquidity", "Smart Money".
---

# When to use

User wants candidate SMC zones on a chart. **These are candidate zones, not signals** — backtest before trusting any combination as an entry trigger.

# Upstream library

[`joshyattridge/smart-money-concepts`](https://github.com/joshyattridge/smart-money-concepts) — MIT, the most-starred Python SMC lib. Functions: `swing_highs_lows`, `bos_choch`, `ob`, `fvg`, `liquidity`, `sessions`.

# Recipe

```
/smc-scan --symbol BTCUSDT --timeframe 1h --years 1 --concepts fvg,ob,bos,liquidity --plot
```

```python
import smartmoneyconcepts as smc
sh = smc.swing_highs_lows(df, swing_length=50)
bos = smc.bos_choch(df, sh, close_break=True)
ob  = smc.ob(df, sh, close_mitigation=False)
fvg = smc.fvg(df, join_consecutive=False)
liq = smc.liquidity(df, sh, range_percent=0.01)
```

Emit:
- List of active FVGs (untested gaps): `(timestamp, top, bottom, side)`.
- List of unmitigated order blocks.
- Most recent BOS / CHoCH events.
- Liquidity pools with sweep status.

Plotting: overlay on candles using `mplfinance` or `plotly`, save to `reports/smc-scan/<symbol>/<ts>/chart.png`.

# Output convention

`reports/smc-scan/<symbol>/<ts>/{zones.json, chart.png, alerts.json}`.

# Install on first use

```bash
uvx --with smartmoneyconcepts --with mplfinance --with yfinance python -c "import smartmoneyconcepts"
```

# Don't

- Don't conflate detection with edge — ICT/SMC patterns are discretionary; many backtests show no statistical edge on their own.
- Don't tune `swing_length` to fit history — that's curve-fitting at the detection layer.
- Don't redistribute outputs from unlicensed SMC Pine repos (Ahmed-GoCode/Quant-Edge etc.) — reference only.
