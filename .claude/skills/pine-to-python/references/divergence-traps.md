# Pine → Python divergence traps

The seven failure modes that have repeatedly produced ≥2% drift between TradingView Strategy Tester and Backtesting.py / vectorbt parity runs. Each section: **symptom → buggy code → fix → why**.

---

## Trap 1 — Bar-index direction confusion

**Symptom.** Trade count is off by ±1 per ~10 trades; Sharpe magnitude similar but sign sometimes flips on flat sections.

**Buggy translation:**

```python
# Pine: prev_close = close[1]
prev_close = self.data.Close.iloc[1]   # WRONG — this is the SECOND bar of the entire series
```

**Fix:**

```python
prev_close = self.data.Close[-2]       # last-but-one bar — Backtesting.py series are reverse-indexable inside next()
# OR vectorised at init:
self.prev_close = self.I(lambda c: pd.Series(c).shift(1), self.data.Close)
```

**Why.** Pine series are **present-indexed**: `close[0]` = current bar, `close[1]` = one bar ago. pandas `.iloc[k]` is **positional from the start of the series**. Inside Backtesting.py's `next()`, `self.data.Close[-1]` is the current bar and `self.data.Close[-2]` is one bar ago — which matches Pine's `close[1]`. For vectorised code outside `next()`, always use `.shift(k)`, never `.iloc[k]`.

---

## Trap 2 — Lookahead repaint

**Symptom.** Pine reports a stellar Sharpe (e.g., 3.5) that no honest Python port can reproduce. Python parity comes in around 0.8.

**Buggy Pine:**

```pine
htf_close = request.security(syminfo.tickerid, "D", close, lookahead=barmerge.lookahead_on)
buy = close > htf_close   // peeks at the end-of-day close while inside the day
```

**Fix.** Refuse the translation. The skill must halt and write to `parity-report.md`:

```
WARNING: Source uses request.security(..., lookahead=barmerge.lookahead_on).
This repaints — there is no honest Python equivalent. TradingView's reported
backtest stats are inflated. Re-run the Pine source with
lookahead=barmerge.lookahead_off and gaps=barmerge.gaps_off before porting.
```

**Why.** `lookahead_on` lets the higher-timeframe series return its **final** value for the period to bars that occur *inside* the period — i.e., it peeks at the future. Live trading cannot do this; an honest backtest cannot either. The Pine number is a lie.

---

## Trap 3 — Crossover off-by-one

**Symptom.** Identical indicator values, but entries happen one bar earlier or later than Pine.

**Buggy:**

```python
# Pine: ta.crossover(a, b)
cross = (a > b) & (a.shift(-1) <= b.shift(-1))   # WRONG direction — shift(-1) is the FUTURE
```

**Fix:**

```python
cross = (a > b) & (a.shift(1) <= b.shift(1))
# OR inside next():
from backtesting.lib import crossover
if crossover(self.a, self.b): self.buy()
```

**Why.** `a.shift(1)` returns the value from one bar ago aligned to the current bar — which is what Pine's `a[1]` means. `shift(-1)` would peek into the future. The `backtesting.lib.crossover` helper does this correctly; prefer it.

---

## Trap 4 — Commission / slippage parity

**Symptom.** Sharpe identical, CAGR off by 1–3% per year, MaxDD nearly identical.

**Buggy:**

```pine
strategy("S", commission_type=strategy.commission.percent, commission_value=0.05, slippage=2)
```

```python
bt = Backtest(df, S, cash=10_000)   # commission defaults to 0 — silent
```

**Fix:**

```python
# Pine commission_value=0.05 is 0.05% per side = 0.0005 fraction per side.
# Backtesting.py 'commission' is per-trade fraction applied on each side.
bt = Backtest(df, S, cash=10_000, commission=0.0005)
# Pine slippage=2 ticks: implement as adverse fill in a custom Broker, or bake into commission as a rough approximation.
```

**Why.** Pine's `commission_value` semantics (percent vs per-contract vs cash-per-order) depend on `commission_type`. Backtesting.py only has a fraction. Slippage in ticks requires a custom `Broker` subclass or an inflated commission proxy. Always declare both engines' fee model in `parity-report.md`.

---

## Trap 5 — Session and holiday filtering

**Symptom.** Python MaxDD substantially smaller than Pine's; Python wins on weekends/holidays it shouldn't have traded.

**Buggy:**

```python
df = yf.download("ES=F", interval="1h")
bt = Backtest(df, S).run()   # trades 24/5 including overnight and Sunday open
```

**Fix:**

```python
import pandas_market_calendars as mcal
cal = mcal.get_calendar("CME_Equity")
schedule = cal.schedule(start_date=df.index.min(), end_date=df.index.max())
df = df.loc[mcal.date_range(schedule, frequency="1h")]
# For intraday RTH only:
df = df.between_time("09:30", "16:00")
```

**Why.** Pine respects the chart's exchange session and skips holidays via `syminfo`. A naive pandas index trades every row. The fix is to mask the dataframe before passing to `Backtest`. yfinance futures data includes the overnight session; equity index futures look very different traded RTH-only vs 24/5.

---

## Trap 6 — Warmup NaN propagation

**Symptom.** First N bars of Python signals are `NaN` and either (a) get treated as `False` and silently miss valid early signals, or (b) propagate into vectorbt portfolios as NaN positions.

**Buggy:**

```python
fast = pandas_ta.ema(close, length=12)   # first 11 are NaN
slow = pandas_ta.ema(close, length=200)  # first 199 are NaN
entries = fast > slow                     # everywhere NaN, comparison is False
# Backtest runs on full df, but the first 199 bars contribute nothing — Pine would have plotted na.
```

**Fix:**

```python
warmup = max(12, 200)
df = df.iloc[warmup:].copy()
# OR for vectorbt:
entries = (fast > slow).fillna(False)
exits   = (fast < slow).fillna(False)
```

**Why.** Pine plots `na` for warmup bars and `strategy.entry` cannot fire on `na` conditions — equivalent to dropping them. Backtesting.py treats `NaN > x` as False (matches Pine), but vectorbt may keep the NaN and produce a NaN portfolio value, contaminating Sharpe. Always slice the warmup off explicitly.

---

## Trap 7 — `request.security` alignment

**Symptom.** Higher-timeframe condition triggers one daily bar late in Python compared to Pine.

**Buggy:**

```python
daily = df['Close'].resample('1D').last()
df['daily_close'] = daily.reindex(df.index, method='ffill')   # ffill of bar that closes at 16:00
# Pine equivalent reads the PREVIOUS day's close, not the current forming day's close.
```

**Fix:**

```python
daily = df['Close'].resample('1D').last()
df['daily_close'] = daily.shift(1).reindex(df.index, method='ffill')
# Now bars on day T see day T-1's close — matches Pine's default
# request.security(..., lookahead=barmerge.lookahead_off).
```

**Why.** With `lookahead=barmerge.lookahead_off` (the safe default), Pine returns the higher-timeframe value from the **previous completed period**, not the in-progress one. Resample-then-ffill without a shift accidentally exposes the current period's data as soon as it closes — which is half a step toward repainting.

---

## Verification checklist (run before declaring parity)

- [ ] Every `series[k]` translated to `.shift(k)` (or `[-k-1]` inside `next()`), not `.iloc[k]`.
- [ ] No `lookahead=barmerge.lookahead_on` survived translation.
- [ ] `commission=` and (where modelled) slippage explicitly declared and documented.
- [ ] Session filter applied for intraday strategies (`between_time` + market calendar).
- [ ] Warmup bars sliced off (`df.iloc[warmup:]`) before `Backtest(df, ...)`.
- [ ] `request.security` calls have an explicit `.shift(1)` before `ffill` for HTF context.
- [ ] Trade count matches Pine exactly. (Count mismatch ≠ noise; it means signal timing drifted.)
- [ ] Sharpe / CAGR / MaxDD within `--tolerance` (default 2%).
- [ ] At least two symbols verified, not just SPY.
