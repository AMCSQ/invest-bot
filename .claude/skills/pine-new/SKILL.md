---
name: pine-new
description: Generate a TradingView Pine Script v5 or v6 indicator or strategy from a natural-language description. Uses canonical idioms from awesome-pinescript and detection logic from smart-money-concepts as ground truth. Invoke when the user says "Pine script", "TradingView indicator", "make a strategy for TV", "Pine v5/v6".
---

# When to use

User describes a strategy in plain English ("EMA crossover with ATR stop, 2R target"). Returns a compiling .pine file + a doc string of how to add to TradingView.

# Upstream references

- [`pAulseperformance/awesome-pinescript`](https://github.com/pAulseperformance/awesome-pinescript) — MIT idiom catalog (read at generation time, do not vendor).
- [`joshyattridge/smart-money-concepts`](https://github.com/joshyattridge/smart-money-concepts) — Python ground truth when generating SMC indicators.
- [`QuantForgeOrg/PineTS`](https://github.com/QuantForgeOrg/PineTS) — optional local verifier.
- Existing Claude skill: [`TradersPost/pinescript-agents`](https://github.com/TradersPost/pinescript-agents).

# Recipe

```
/pine-new --type indicator|strategy --version 5|6 --name "EMA Cross + ATR Stop" --license MPL-2.0
```

Generate `pine/<name>.pine` with required header:
```pine
//@version=6
// @license MPL-2.0
indicator("EMA Cross + ATR Stop", overlay=true)
fast = input.int(12, "Fast")
slow = input.int(26, "Slow")
ema_fast = ta.ema(close, fast)
ema_slow = ta.ema(close, slow)
plot(ema_fast); plot(ema_slow)
buy  = ta.crossover(ema_fast, ema_slow)
sell = ta.crossunder(ema_fast, ema_slow)
plotshape(buy,  style=shape.triangleup,   location=location.belowbar)
plotshape(sell, style=shape.triangledown, location=location.abovebar)
```

For strategies, use `strategy(...)` + `strategy.entry/exit` with documented `process_orders_on_close=true` to avoid intra-bar fills.

Verify (optional) by running through PineTS locally before printing.

# Output convention

`pine/<name>.pine` + `pine/<name>.md` (usage + chart settings) + a TradingView-paste-ready code block in the chat.

# License default

Always emit MPL-2.0 (the TradingView Pine community standard) unless user overrides.

# Install on first use

PineTS verification is optional. To enable:
```bash
npx -y @quantforge/pinets verify pine/<name>.pine
```

# Don't

- Don't copy code from GPL-3.0 sources (`everget/tradingview-pinescript-indicators`) into MPL output — extract patterns only.
- Don't use `request.security(..., lookahead=barmerge.lookahead_on)` without warning — repaint risk.
- Don't claim a strategy is profitable without `--backtest`-ing on TradingView's strategy tester or via `backtest-runner`.
