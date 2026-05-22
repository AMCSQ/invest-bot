# Pine v5/v6 → Python translation table

Reference table for `/pine-to-python`. Default Python target is **Backtesting.py**; vectorbt equivalent given where it differs. Indicator-library bank is **pandas-ta** (MIT), with TA-Lib as fallback.

Notation:
- `src` = a Pine series, usually `close`. In Python = `self.data.Close` (Backtesting.py) or a `pd.Series`.
- `n` = an integer length parameter.
- `H/L/C/V` = `self.data.High / Low / Close / Volume`.
- Where Backtesting.py needs `self.I(...)`, that wrapper is what makes the indicator show on the plot. Wrap every long-lived series in `self.I`.

## §1 `ta.*` — moving averages and smoothing

| # | Pine | Python (Backtesting.py + pandas-ta) | Notes |
|---|---|---|---|
| 1 | `ta.sma(src, n)` | `self.I(pandas_ta.sma, pd.Series(src), length=n)` | Simple mean. |
| 2 | `ta.ema(src, n)` | `self.I(pandas_ta.ema, pd.Series(src), length=n)` | `alpha = 2/(n+1)`. Identical formula. |
| 3 | `ta.rma(src, n)` | `self.I(pandas_ta.rma, pd.Series(src), length=n)` | Wilder smoothing, `alpha = 1/n`. **Do not** substitute `ema` — RSI/ATR break. |
| 4 | `ta.wma(src, n)` | `self.I(pandas_ta.wma, pd.Series(src), length=n)` | Linear weights `1..n`. |
| 5 | `ta.vwma(src, n)` | `self.I(pandas_ta.vwma, pd.Series(src), pd.Series(V), length=n)` | Needs volume. |
| 6 | `ta.hma(src, n)` | `self.I(pandas_ta.hma, pd.Series(src), length=n)` | Hull MA. |
| 7 | `ta.alma(src, n, offset, sigma)` | `self.I(pandas_ta.alma, pd.Series(src), length=n, offset=offset, sigma=sigma)` | |
| 8 | `ta.linreg(src, n, offset)` | `self.I(pandas_ta.linreg, pd.Series(src), length=n, offset=offset)` | Linear regression value. |
| 9 | `ta.swma(src)` | Manual: `0.1666*src.shift(3) + 0.3333*src.shift(2) + 0.3333*src.shift(1) + 0.1666*src` | Symmetric 4-bar WMA. |

## §2 `ta.*` — oscillators and momentum

| # | Pine | Python | Notes |
|---|---|---|---|
| 10 | `ta.rsi(src, n)` | `self.I(pandas_ta.rsi, pd.Series(src), length=n)` | Uses Wilder RMA internally. |
| 11 | `ta.stoch(C, H, L, n)` | `self.I(lambda c,h,l,k: pandas_ta.stoch(h,l,c,k=k).iloc[:,0], C, H, L, n)` | pandas-ta returns DataFrame; pick `STOCHk_<n>_3_3`. |
| 12 | `ta.macd(src, f, s, sig)` | `self.I(lambda s_,f,sl,sg: pandas_ta.macd(s_, fast=f, slow=sl, signal=sg).iloc[:,0], pd.Series(src), f, s, sig)` | Returns 3 cols: MACD, hist, signal. |
| 13 | `ta.cci(src, n)` | `self.I(pandas_ta.cci, H, L, C, length=n)` | |
| 14 | `ta.mfi(src, n)` | `self.I(pandas_ta.mfi, H, L, C, V, length=n)` | Needs volume. |
| 15 | `ta.mom(src, n)` | `pd.Series(src).diff(n)` or `self.I(pandas_ta.mom, pd.Series(src), length=n)` | |
| 16 | `ta.roc(src, n)` | `self.I(pandas_ta.roc, pd.Series(src), length=n)` | |
| 17 | `ta.tsi(src, long, short)` | `self.I(pandas_ta.tsi, pd.Series(src), fast=short, slow=long)` | |
| 18 | `ta.cmo(src, n)` | `self.I(pandas_ta.cmo, pd.Series(src), length=n)` | Chande Momentum. |
| 19 | `ta.willr(H, L, C, n)` | `self.I(pandas_ta.willr, H, L, C, length=n)` | Williams %R. |

## §3 `ta.*` — volatility and bands

| # | Pine | Python | Notes |
|---|---|---|---|
| 20 | `ta.atr(n)` | `self.I(pandas_ta.atr, H, L, C, length=n)` | Wilder smoothed true range. |
| 21 | `ta.tr` | `self.I(pandas_ta.true_range, H, L, C)` | Unsmoothed true range. |
| 22 | `ta.bb(src, n, mult)` | `self.I(lambda s,n,m: pandas_ta.bbands(s, length=n, std=m).iloc[:,0:3], pd.Series(src), n, mult)` | Returns lower/mid/upper. |
| 23 | `ta.kc(src, n, mult)` | `self.I(pandas_ta.kc, H, L, C, length=n, scalar=mult)` | Keltner. |
| 24 | `ta.dev(src, n)` | `pd.Series(src).rolling(n).std()` * adjusted; or `self.I(pandas_ta.stdev, pd.Series(src), length=n)` | Mean abs deviation in Pine vs std in pandas — read Pine docs carefully. |
| 25 | `ta.stdev(src, n)` | `self.I(pandas_ta.stdev, pd.Series(src), length=n)` | Sample stdev. |
| 26 | `ta.variance(src, n)` | `pd.Series(src).rolling(n).var()` | |

## §4 `ta.*` — crossovers, extremes, comparisons

| # | Pine | Python | Notes |
|---|---|---|---|
| 27 | `ta.crossover(a, b)` | Inside `next()`: `crossover(a, b)` from `backtesting.lib`. Vectorised: `(a > b) & (a.shift(1) <= b.shift(1))` | Direction-sensitive — see divergence-traps.md. |
| 28 | `ta.crossunder(a, b)` | `crossover(b, a)` or `(a < b) & (a.shift(1) >= b.shift(1))` | |
| 29 | `ta.cross(a, b)` | `((a > b) & (a.shift(1) <= b.shift(1))) \| ((a < b) & (a.shift(1) >= b.shift(1)))` | Either direction. |
| 30 | `ta.highest(src, n)` | `pd.Series(src).rolling(n).max()` | |
| 31 | `ta.lowest(src, n)` | `pd.Series(src).rolling(n).min()` | |
| 32 | `ta.highestbars(src, n)` | `n - 1 - pd.Series(src).rolling(n).apply(np.argmax, raw=True)` then negate | Pine returns offset to highest bar (negative ago). |
| 33 | `ta.lowestbars(src, n)` | mirror of above with `argmin` | |
| 34 | `ta.barssince(cond)` | `cond.cumsum().groupby(cond.cumsum()).cumcount()` then mask where `cumsum==0` → NaN | Number of bars since last True. |
| 35 | `ta.valuewhen(cond, src, occ)` | `pd.Series(src).where(cond).ffill().shift(occ)` | The `src` value at the Nth most recent `cond==True`. |
| 36 | `ta.change(src, n=1)` | `pd.Series(src).diff(n)` | |
| 37 | `ta.percentrank(src, n)` | `pd.Series(src).rolling(n).apply(lambda x: (x.rank().iloc[-1]-1)/(len(x)-1)*100, raw=False)` | |
| 38 | `ta.correlation(a, b, n)` | `a.rolling(n).corr(b)` | |

## §5 `math.*` namespace

| # | Pine | Python | Notes |
|---|---|---|---|
| 39 | `math.abs(x)` | `np.abs(x)` / `x.abs()` | |
| 40 | `math.max(a, b)` | `np.maximum(a, b)` | Element-wise for series. |
| 41 | `math.min(a, b)` | `np.minimum(a, b)` | |
| 42 | `math.round(x, n)` | `np.round(x, n)` | |
| 43 | `math.log(x)` / `math.log10` | `np.log(x)` / `np.log10` | |
| 44 | `math.sqrt(x)` | `np.sqrt(x)` | |
| 45 | `math.pow(x, y)` | `np.power(x, y)` or `x**y` | |
| 46 | `math.sign(x)` | `np.sign(x)` | |
| 47 | `math.random()` | `np.random.random()` | Seed at `init` for repro. |

## §6 `request.*` — multi-timeframe / multi-symbol

| # | Pine | Python | Notes |
|---|---|---|---|
| 48 | `request.security(syminfo.tickerid, "D", close)` | Resample base df: `daily = df.resample("1D").agg({'Open':'first','High':'max','Low':'min','Close':'last','Volume':'sum'}).dropna(); aligned = daily['Close'].reindex(df.index, method='ffill')` | Use `'1W'`, `'1M'` for higher TFs. Always `ffill` to base index. |
| 49 | `request.security(..., lookahead=barmerge.lookahead_on)` | **Refuse** — repaints. Emit a warning in `parity-report.md`. | If user insists, only acceptable inside `verify` to *measure* the repaint gap. |
| 50 | `request.security(..., lookahead=barmerge.lookahead_off, gaps=barmerge.gaps_off)` | Resample + `ffill` (default). | Honest path. |
| 51 | `request.security("AAPL", tf, close)` | Load second symbol via yfinance, resample to base tf, align on index. | |
| 52 | `request.security_lower_tf(...)` | Up-aggregate via groupby on intraday bars; rarely needed in backtest. | |

## §7 `strategy.*` — order management

| # | Pine | Python | Notes |
|---|---|---|---|
| 53 | `strategy("name", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100, commission_type=strategy.commission.percent, commission_value=0.05, slippage=2)` | `Backtest(df, S, cash=10_000, commission=0.0005, exclusive_orders=True)` + per-trade size on `self.buy(size=0.99)` | Slippage requires custom `Broker` subclass. |
| 54 | `strategy.entry("L", strategy.long)` | `self.buy()` | |
| 55 | `strategy.entry("L", strategy.long, qty=2)` | `self.buy(size=2)` | Integer = units, float ≤1 = fraction of equity. |
| 56 | `strategy.entry("S", strategy.short)` | `self.sell()` | |
| 57 | `strategy.exit("X", "L", stop=s, limit=t)` | `self.buy(sl=s, tp=t)` at entry time | Backtesting.py attaches SL/TP at order placement. |
| 58 | `strategy.close("L")` | `self.position.close()` | Closes all. |
| 59 | `strategy.close_all()` | `self.position.close()` | Single-position model. |
| 60 | `strategy.cancel("L")` | `for o in self.orders: o.cancel()` | |
| 61 | `strategy.position_size` | `self.position.size` | Float, sign indicates direction. |
| 62 | `strategy.position_avg_price` | `self.position.pl_pct` is closest; entry price = `self.trades[-1].entry_price` | |
| 63 | `strategy.equity` | `self.equity` | |
| 64 | `strategy.opentrades` | `1 if self.position else 0` (single-position) | |
| 65 | `strategy.netprofit` | Available post-run in `stats['Equity Final [$]'] - stats['Equity Peak [$]']` style; during `next()`: track manually. | |
| 66 | `strategy.risk.max_drawdown(value, strategy.percent_of_equity)` | Implement manually in `next()`: stop trading if `(self.equity / self._peak - 1) < -value/100`. | Pine has built-in risk halt; Backtesting.py does not. |

## §8 `plot.*` and visualisation

| # | Pine | Python | Notes |
|---|---|---|---|
| 67 | `plot(ema, "EMA", color.blue)` | Wrap indicator in `self.I(..., name='EMA', color='blue', overlay=True)` | Backtesting.py auto-plots wrapped indicators. |
| 68 | `plotshape(buy, style=shape.triangleup, location=location.belowbar)` | Use Bokeh post-run or add a boolean indicator via `self.I` with `plot=True`. | No native triangle markers. |
| 69 | `bgcolor(condition ? color.green : na)` | Post-run: overlay a colored span on the Bokeh figure. | |
| 70 | `hline(70)` | `self.I(lambda c: pd.Series(70, index=c.index), pd.Series(self.data.Close), name='Upper')` | Constant line. |
| 71 | `label.new(...)` | Skip in backtest; log via `self._log_alert`. | Labels are TV-UI only. |
| 72 | `table.new(...)` | Skip; emit a `parity-report.md` table at the end of the run. | |

## §9 `input.*` — parameter declarations

| # | Pine | Python | Notes |
|---|---|---|---|
| 73 | `input.int(12, "Fast", minval=2)` | Class attr: `fast = 12` — sweep range goes in `bt.optimize(fast=range(2, 30))`. | |
| 74 | `input.float(0.5, "Risk", minval=0, maxval=1, step=0.05)` | `risk = 0.5` class attr; cast input in `init` if needed. | |
| 75 | `input.bool(true, "UseStop")` | `use_stop = True` class attr. | |
| 76 | `input.string("EMA", "Type", options=["SMA","EMA","WMA"])` | `ma_type = "EMA"`; assert in `init`. | |
| 77 | `input.source(close, "Src")` | Default to `self.data.Close`; expose `src_name = "Close"` to let `run.py` swap series. | |
| 78 | `input.timeframe("D", "HTF")` | `htf = "1D"` class attr; consume via resample call. | |
| 79 | `input.symbol("NASDAQ:AAPL", "Sym2")` | Pass symbol into `run.py`; not a `Strategy` attribute. | |
| 80 | `input.color(color.blue, "Color")` | Skip; styling lives in `run.py` Bokeh layer. | |
| 81 | `input.session("0930-1600", "Sess")` | `session = ("09:30", "16:00")`; use with `df.between_time`. | |

## §10 `time.*` and dates

| # | Pine | Python | Notes |
|---|---|---|---|
| 82 | `time` | `self.data.index[-1]` inside `next()` (a `pd.Timestamp`). | |
| 83 | `timestamp(2024, 1, 1, 0, 0)` | `pd.Timestamp("2024-01-01")` | |
| 84 | `time_close` | `self.data.index[-1]` (Backtesting.py bars close at index). | |
| 85 | `dayofweek` | `self.data.index[-1].dayofweek` (Monday=0). | Pine Sunday=1, shift by 1. |
| 86 | `hour` / `minute` | `.hour`, `.minute` on the Timestamp. | |
| 87 | `time_tradingday` | Use `pandas_market_calendars.get_calendar('NYSE').schedule(...)` to align session day. | |

## §11 `str.*`

| # | Pine | Python | Notes |
|---|---|---|---|
| 88 | `str.tostring(x)` | `str(x)` or `f"{x}"` | |
| 89 | `str.format("{0}, {1}", a, b)` | `f"{a}, {b}"` | |
| 90 | `str.contains(s, sub)` | `sub in s` | |
| 91 | `str.replace_all(s, a, b)` | `s.replace(a, b)` | |

## §12 `array.*`

| # | Pine | Python | Notes |
|---|---|---|---|
| 92 | `array.new_float(n, 0.0)` | `np.zeros(n)` or `[0.0]*n` | |
| 93 | `array.push(arr, x)` | `arr.append(x)` (list) or `np.append(arr, x)` | |
| 94 | `array.pop(arr)` | `arr.pop()` | |
| 95 | `array.get(arr, i)` | `arr[i]` | |
| 96 | `array.size(arr)` | `len(arr)` | |
| 97 | `array.sum(arr)` | `sum(arr)` or `np.sum(arr)` | |
| 98 | `array.avg(arr)` | `np.mean(arr)` | |
| 99 | `array.stdev(arr)` | `np.std(arr, ddof=1)` | Pine uses sample stdev. |
| 100 | `array.sort(arr)` | `arr.sort()` | |
| 101 | `array.slice(arr, i, j)` | `arr[i:j]` | |

## §13 `matrix.*`

| # | Pine | Python | Notes |
|---|---|---|---|
| 102 | `matrix.new<float>(r, c, 0)` | `np.zeros((r, c))` | |
| 103 | `matrix.set(m, r, c, v)` | `m[r, c] = v` | |
| 104 | `matrix.get(m, r, c)` | `m[r, c]` | |
| 105 | `matrix.rows(m)` / `matrix.columns(m)` | `m.shape[0]` / `m.shape[1]` | |

## §14 `map.*`

| # | Pine | Python | Notes |
|---|---|---|---|
| 106 | `map.new<string, float>()` | `{}` (dict) | |
| 107 | `map.put(m, k, v)` | `m[k] = v` | |
| 108 | `map.get(m, k)` | `m.get(k)` | |
| 109 | `map.contains(m, k)` | `k in m` | |
| 110 | `map.size(m)` | `len(m)` | |

## §15 `barstate.*`, `syminfo.*`, `timeframe.*`

| # | Pine | Python | Notes |
|---|---|---|---|
| 111 | `barstate.isconfirmed` | `True` | All backtest bars are confirmed. |
| 112 | `barstate.isrealtime` | `False` in backtest; `True` in `/broker-connect` paper. | |
| 113 | `barstate.isfirst` | `len(self.data) == 1` inside `next()` | |
| 114 | `barstate.islast` | `len(self.data) == len(self.data.Close)` | Rarely useful in backtest. |
| 115 | `syminfo.ticker` | `self.ticker` class attr, bound in `run.py`. | |
| 116 | `syminfo.mintick` | `self.mintick = 0.01` class attr; pass at runtime. | |
| 117 | `syminfo.timezone` | `df.index.tz` | |
| 118 | `timeframe.period` | `self.timeframe = "1d"` class attr; or infer from `df.index.freq`. | |
| 119 | `timeframe.isintraday` | `self.timeframe.endswith(("m","h","T","H"))` | |

## §16 Alerts / logging

| # | Pine | Python | Notes |
|---|---|---|---|
| 120 | `alert("Buy " + syminfo.ticker, alert.freq_once_per_bar_close)` | `self._log_alert("Buy " + self.ticker)` — writes a JSONL line. | Alerts don't fire offline; log them so live path can reuse the same string. |
| 121 | `alertcondition(cond, "title", "msg")` | Track `cond` history; emit logs when transitions to True. | |
| 122 | `log.info(msg)` / `log.warning` / `log.error` | `import logging; logging.info(msg)` etc. — write to `reports/.../<name>.log`. | |

## §17 Type / namespace edge cases

| # | Pine | Python | Notes |
|---|---|---|---|
| 123 | `na` | `float('nan')` or `np.nan` | |
| 124 | `nz(x, 0)` | `x if not np.isnan(x) else 0` or `pd.Series(x).fillna(0)` | |
| 125 | `na(x)` | `np.isnan(x)` | |
| 126 | `bool(x)` | `bool(x)` | |
| 127 | `int(x)` | `int(x)` | |
| 128 | `float(x)` | `float(x)` | |
| 129 | `var x = 0` | Class attr or `self._x = 0` set in `init`. | `var` persists across bars; default Python locals do not. |
| 130 | `varip x = 0` | Same as `var` for backtest (only differs in realtime). | |
