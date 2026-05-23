# Swing profile

A focused subset of Financial-Planner tuned for the **multi-day swing trader** on US equities and ETFs, holding 2-20 days.

## Who this is for

You scan Sunday night for setups, you build a 5-10 name shortlist for the week, you place limit orders or stop-buys on Monday, and you hold positions 3-10 days while a day job keeps you off the tape midday. You think in R-multiples, not dollars. You are equally happy entering a 52w breakout, an oversold mean-revert, a post-earnings drift, or a base-and-break — but you do not chase, you do not scalp, and you do not babysit. You make 3-10 decisions per week, you journal every one, and once a month you ask "what are my recurring leaks?"

If that is you, this profile strips out the 0DTE-options, intraday tape, retirement, ETF-decomposition, and live-greeks noise so the LLM stays focused on setup screening, R-based sizing, and the journal-decision-review loop.

## Default skills

| Skill | Use it for |
|---|---|
| `equities-screener` | Weekend scan with saved filter packs: `gap-and-go`, `52w-high-breakout`, `oversold-bounce`, `base-break`. |
| `ta-indicators` | Add RSI/ATR/EMA/VWAP to candidate OHLCV before sizing entries. |
| `chart-render` | Annotated PNG/HTML of the setup — entry, stop, target marked. |
| `smc-scan` | When a candidate is at a swing level, confirm with FVG / OB / liquidity context. |
| `regime-detect` | Is the index trending or chopping? Gates whether breakouts or mean-reverts get priority. |
| `sentiment-scan` | News sentiment on the shortlist before Monday open. |
| `market-data` | OHLCV pull (yfinance default, polygon if you have the key). |
| `decision-card` | 90-second Annie-Duke pre-mortem per shortlist symbol — thesis, falsifiers, expected R. |
| `pre-trade-checklist` | Pre-market go/no-go; writes `data/state.yaml`. |
| `session-warmup` | 60-second briefing — overnight futures, calendar, open positions. |
| `trade-journal` | YAML-frontmatter MD per fill; rolling expectancy. |
| `mistake-miner` | Monthly clustering of failure modes with dollar-cost ranking. |
| `quant-tearsheet` | Weekly NAV review vs SPY benchmark. |
| `backtest-runner` | Quarterly refresh on your top 2 setups against last quarter's bars. |
| `pine-new` / `pine-to-python` | Author a TradingView alert in Pine, then validate offline parity. |
| `risk-var` | Sanity-check weekly portfolio downside before going home Friday. |
| `broker-connect` | Wire Alpaca (paper first); satellite to live when adherence holds. |

## Skills excluded from this profile

- `retire-fire`, `debt-payoff`, `portfolio-optimize` — wrong horizon; lives in `../long-term/`.
- `etf-analyzer` — you trade ETFs as tickers, not as basket decompositions.
- `options-chain`, `options-strategy-builder`, `greeks-monitor`, `iv-surface`, `vol-forecast` — no options book here; route to `../options/` if you want to replace equity exposure with calls.
- `tilt-guard` — kept available but not default-loaded; swing cadence (3-10 trades/wk) does not generate the rolling features tilt-guard needs to be reliable. Day-traders get more value.
- `tax-loss-harvest` — December sweep belongs in `../long-term/`. Re-enable here if your swing sleeve has accumulated > 10 closed losers in taxable.
- `daily-routine` — built for the intraday trader. Swing has its own weekend-led rhythm; see `PLAYBOOK.md`.
- `statarb-scan`, `iv-surface`, `greeks-monitor` — wrong asset class / wrong horizon.
- `dashboard-build`, `tradingview-embed`, `alert-webhook` — optional UI; enable when you outgrow the Markdown reports.

## Where the data lives

- `data/journal/YYYY-MM-DD/<order_id>.md` — one MD per fill (open + close blocks).
- `data/journal/expectancy.json` — rolling win-rate / avg-R / expectancy windows.
- `data/decisions/<order_id>.md` — pre-mortem decision card keyed to the order.
- `data/screeners/<name>.yaml` — saved filter packs.
- `data/state.yaml` — pre-trade-checklist go/no-go output.
- `reports/screener/<UTC-ts>/` — weekend scan results.
- `reports/reviews/YYYY-MM.md` — monthly mistake-miner output.
- `reports/tearsheet/YYYY-Www/` — weekly NAV review.
- `strategies/<name>/` — backtest-runner scaffolds for setup refresh.

## Cross-profile

- `../long-term/` for the **core sleeve** — index funds, retirement, December tax-loss sweep. Swing here is the **satellite sleeve**.
- `../day-trading/` if you start scaling intraday and the 2-day minimum hold is the bottleneck.
- `../options/` if you want to replace equity exposure with defined-risk long calls or vertical debit spreads (same setup, less capital tied up).

Each profile owns its own LLM persona and skill list so they do not bleed into each other. If you ever want to spin this profile out into a standalone repo, see [`EXTRACT.md`](./EXTRACT.md).

## Quick start

```bash
cd profiles/swing && claude
```

The profile-local `.claude/settings.json` and `.claude/CLAUDE.md` are read automatically by Claude Code from cwd upward, so the swing persona loads before any sibling profile's instructions.
