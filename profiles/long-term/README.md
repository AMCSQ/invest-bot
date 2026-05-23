# Long-term profile

A focused subset of Financial-Planner tuned for the **buy-and-hold investor** who measures the holding period in years, not minutes.

## Who this is for

You contribute to a 401(k) + Roth IRA + taxable brokerage every paycheck, you rebalance the whole stack once or twice a year (typically January and after a big market move), you sweep for tax-loss harvest candidates in December, and you re-run your retirement projection on your birthday. You own broad-market index funds, maybe a factor tilt or two (SCHD, AVUV, VTV), and you genuinely do not care what the S&P did this morning. Less than one investing decision per week is normal and good.

If that is you, this profile strips out the day-trading, tilt-detection, options-Greeks, intraday-charting, and SMC-pattern noise so the LLM is not constantly suggesting tools you do not want.

## Default skills

| Skill | Use it for |
|---|---|
| `etf-analyzer` | Decompose a fund: expense ratio, top holdings, sector tilt, overlap with another fund. |
| `portfolio-optimize` | Suggest target weights (HRP, risk-parity, min-vol) across the core sleeve. |
| `retire-fire` | Annual "can I still retire on schedule?" simulation with VPW / Guyton-Klinger / fixed rules. |
| `tax-loss-harvest` | December sweep — wash-sale-aware harvest candidates plus IRA cross-account trap detection. |
| `debt-payoff` | Avalanche vs snowball schedule when a windfall lands or a new debt appears. |
| `risk-var` | Annual downside check — what is the realistic 1-year 5% VaR of the portfolio? |
| `quant-tearsheet` | Annual NAV review against SPY / 60-40 benchmark. |
| `market-data` | Pull yfinance daily bars for any of the above. |
| `dashboard-build` | Optional Streamlit allocation dashboard sourced from `data/positions/holdings.yaml`. |

## Skills excluded from this profile

- `smc-scan`, `pine-new`, `pine-to-python`, `chart-render`, `ta-indicators`, `backtest-runner` — intraday / chart-driven, irrelevant at decade horizon.
- `tilt-guard`, `pre-trade-checklist`, `decision-card`, `trade-journal`, `mistake-miner`, `session-warmup`, `daily-routine` — discipline tooling sized for an active trader; one trade a quarter does not generate enough signal.
- `options-chain`, `options-strategy-builder`, `greeks-monitor`, `iv-surface`, `vol-forecast` — no options here.
- `equities-screener`, `sentiment-scan`, `statarb-scan`, `regime-detect` — name-picking and regime-switching are not part of the strategy.
- `alert-webhook`, `broker-connect`, `tradingview-embed` — no real-time alerts, no order placement.

## Where the data lives

- `data/positions/holdings.yaml` — user-maintained source of truth: symbol, account, shares, cost basis, target weight.
- `data/contributions/YYYY.yaml` — paycheck-by-paycheck contribution log (optional).
- `reports/annual-review/YYYY/` — the once-a-year IPS review, retire-fire output, tearsheet.
- `reports/quarterly-review/YYYY-Qn/` — factor-tilt audit and overlap check.
- `data/tax/` — wash-sale ledger and bracket config consumed by `tax-loss-harvest`.

## Cross-profile

This profile is the **core sleeve**. If you also run a **swing-trading satellite sleeve** with a 1-8 week horizon, switch to `../swing/` for that work and come back here for the core. Same for `../day-trading/` (intraday equities) and `../options/` (defined-risk spreads). Each profile owns its own LLM persona and skill list so they do not bleed into each other.

If you ever want to spin this profile out into a standalone repo, see [`EXTRACT.md`](./EXTRACT.md).

## Quick start

```bash
cd profiles/long-term && claude
```

The profile-local `.claude/settings.json` and `.claude/CLAUDE.md` are read automatically by Claude Code from cwd upward, so the long-term persona loads before any sibling profile's instructions.
