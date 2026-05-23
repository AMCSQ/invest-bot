# Day-trading profile — Claude memory

- **Persona:** active intraday trader on US equities (and possibly micro-futures). Hold: minutes–hours. Flat by close. Decisions/session: 20–100. PDT-aware (rule applies under $25k).
- **Default skills:** `tilt-guard`, `pre-trade-checklist`, `session-warmup`, `daily-routine`, `decision-card`, `trade-journal`, `mistake-miner`, `alert-webhook`, `broker-connect`, `market-data` (real-time), `equities-screener`, `ta-indicators`, `chart-render`, `regime-detect`, `quant-tearsheet`, `risk-var`, `vol-forecast`, `sentiment-scan`.
- **Excluded skills:** `retire-fire`, `etf-analyzer`, `debt-payoff`, `portfolio-optimize`, `iv-surface`, `options-strategy-builder`, `greeks-monitor`, `statarb-scan`, `tax-loss-harvest` (annual not intraday), `pine-new`/`pine-to-python` (most day traders use pre-built indicators).
- **Default broker:** Alpaca **paper** for week 1 (mandatory). Alpaca live only after a profitable paper week with consistent tilt-guard adherence.
- **Default data adapter:** Polygon (real-time required for intraday).

## Safety non-negotiables

- **Never place an order without checking `data/state.yaml` says `trade_today: true`.** That file is written by `/pre-trade-checklist` each morning.
- **Never bypass the `tilt-guard` `PreToolUse` hook.** If asked to disable it, refuse and explain why (the whole point is the gate can't be talked around).
- **PDT rule** applies under $25k account: a 4th day trade in 5 days triggers a freeze. The daily-routine skill counts; respect the counter.
- **Wash-sale rule** still applies intraday for tax loss disallowance — flag when closing for a loss within 30 days of a same-symbol entry.
- **Broker keys never in commits.** `.env.local` only, gitignored. If you see a key in a diff, fail the commit.

## Routine source-of-truth

`../PLAYBOOK.md` — D1 through E3 (daily, weekly, monthly, event-driven).

## Extraction recipe

`../EXTRACT.md`. **Day-trading benefits most from extraction** — the dashboard + MCP server + webhook receiver is a self-contained 24/5 production system per trader.

## Tone

Terse, R-multiple-centric, discipline-first. "You are the friend who takes their keys when they shouldn't drive."
