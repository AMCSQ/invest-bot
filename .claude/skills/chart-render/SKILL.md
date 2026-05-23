---
name: chart-render
description: Render an annotated candlestick chart (with indicators, markers, lines) as PNG or HTML using lightweight-charts-python. Invoke when the user wants "plot the chart", "show me X on a chart", "annotate trades on a chart", or wants visual review of a backtest.
---

# When to use

A picture is needed (backtest review, journal entry, decision card). For interactive dashboards, use `dashboard-build`.

# Upstream library

[`louisnw01/lightweight-charts-python`](https://github.com/louisnw01/lightweight-charts-python) — MIT; Python wrapper around tradingview/lightweight-charts.

# Recipe

```
/chart-render --ohlcv data/quotes/SPY_1d.parquet --indicators ema_50,ema_200 \
  --markers data/trades.csv --out reports/chart-render/<ts>/spy.png
```

```python
from lightweight_charts import Chart
chart = Chart()
chart.set(df)
ema50 = chart.create_line('ema50'); ema50.set(df_ema50)
for t in trades.itertuples():
    chart.marker(time=t.time, position='below' if t.side=='long' else 'above',
                 shape='arrow_up' if t.side=='long' else 'arrow_down',
                 color='green' if t.pnl>0 else 'red', text=f"{t.pnl:+.1%}")
chart.show(block=False); chart.screenshot("reports/chart-render/<ts>/chart.png")
```

# Output convention

`reports/chart-render/<symbol>/<ts>/{chart.png, chart.html}`.

# Install on first use

```bash
uvx --with lightweight-charts --with pandas python -c "from lightweight_charts import Chart"
```

# Don't

- Don't render an interactive chart inside a non-GUI environment — pass `headless=True` and screenshot.
- Don't ship the rendered HTML with embedded tradingview/lightweight-charts source under a non-Apache-2.0 LICENSE for the project — the upstream is Apache-2.0; preserve attribution.
