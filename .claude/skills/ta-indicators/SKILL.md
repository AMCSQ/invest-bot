---
name: ta-indicators
description: Enrich an OHLCV DataFrame with standard technical indicators (RSI, MACD, Bollinger, ATR, Ichimoku, OBV, MFI, VWAP, ADX, KAMA, Stoch). Invoke when the user wants "add indicators", "compute RSI/MACD/...", or to prepare features for backtest / ML.
---

# When to use

User has OHLCV and wants standard TA features attached. For pattern detection (H&S, FVG, order blocks) use `smc-scan` or chart-pattern skills.

# Upstream libraries (in fallback order)

1. [`bukosabino/ta`](https://github.com/bukosabino/ta) — MIT, pure pandas/numpy, no binary. **Default**.
2. [`twopirllc/pandas-ta`](https://github.com/twopirllc/pandas-ta) — MIT, pandas accessor. **Maintenance flagged inactive Jul 2026** — only if user explicitly asks; prefer the `pandas-ta-classic` fork.
3. [`TA-Lib`](https://github.com/ta-lib/ta-lib-python) — BSD-2, C-backed, fastest. Only if the C library is already installed on the system.

# Recipe

```
/ta-indicators --ohlcv <parquet|csv> --add rsi,macd,bbands,atr,obv,vwap [--lib ta|pandas-ta|talib]
```

Default path with `ta`:

```python
from ta import add_all_ta_features
df = add_all_ta_features(df, open='open', high='high', low='low', close='close', volume='volume', fillna=True)
```

Selective:

```python
from ta.momentum import RSIIndicator
df['rsi_14'] = RSIIndicator(df['close'], window=14).rsi()
```

# Output convention

Writes back to `data/quotes/<symbol>_features.parquet` (suffix `_features`) and prints the last 5 rows.

# Install on first use

```bash
uvx --with ta --with pandas python -c "import ta"
```

# Don't

- Don't silently use a different library than requested — if the user says "pandas-ta" and it's broken, surface the warning + install the `pandas-ta-classic` fork.
- Don't apply `add_all_ta_features` to a small DataFrame (< 100 rows) — many indicators need ≥ window+1 obs.
